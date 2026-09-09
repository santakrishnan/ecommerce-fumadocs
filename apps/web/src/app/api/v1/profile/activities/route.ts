import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type ActivityAccepted,
  type ActivityEvent,
  activitiesErrorResponse,
  activityEventSchema,
  recordActivity,
} from "~/features/profile/activities/bff";
import {
  appendActivityDebugEntry,
  clearActivityDebugEntries,
  getActivityDebugEntries,
} from "~/features/profile/activities/bff/lib/activity-debug-store";

interface ActivityAcceptedEnvelope {
  data: ActivityAccepted;
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: ActivityAccepted): ActivityAcceptedEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

/**
 * POST /api/v1/profile/activities
 *
 * Records a single visitor activity event. The upstream processes it async
 * (EventBridge → SQS → preference aggregation + S3 archival).
 *
 * Identity is read from httpOnly cookies (_ucmp_visitor_id / _ucmp_session_id).
 * The `type` discriminator is validated via Zod; event-specific fields are
 * validated at the TypeScript level via the SDK's `ActivityEvent` union.
 *
 * In development, each recorded event is also appended to the in-memory debug
 * ring buffer so the /visitor/debug Activity Log shows manually fired console
 * events alongside real app events.
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body) {
      return activitiesErrorResponse({
        code: "BadRequest",
        message: "Request body is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const parsed = activityEventSchema.safeParse(body);
    if (!parsed.success) {
      return activitiesErrorResponse({
        code: "BadRequest",
        message: `Invalid activity event: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await recordActivity(parsed.data as ActivityEvent);

    // Append to dev ring buffer so manually fired debug console events appear
    // in the Activity Log. Wrapped in try/catch — must never affect the response.
    try {
      const identity = await readVisitorIdentity();
      if (identity.visitorId) {
        appendActivityDebugEntry(identity.visitorId, {
          type: parsed.data.type,
          status: result.success ? "success" : "error",
          reason: result.success ? undefined : result.error.message,
        });
      }
    } catch {
      // Debug-only — never propagate.
    }

    if (!result.success) {
      return activitiesErrorResponse(result.error);
    }

    return NextResponse.json(envelope(traceId, result.data), { status: 202 });
  } catch {
    return activitiesErrorResponse({
      code: "InternalError",
      message: "Failed to record activity",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * GET /api/v1/profile/activities
 *
 * Returns the recent activity log for the current visitor from the in-memory
 * dev ring buffer. Dev-only — returns 404 in production.
 *
 * Query parameters:
 * - `?since=<ISO>` — return only entries recorded after this timestamp
 *   (enables efficient incremental polling without re-fetching the full log).
 * - `?action=clear` — wipe the visitor's log and return an empty array.
 *
 * The response also includes `__dev__` diagnostic entries (Zod validation
 * failures that arrive before visitor identity resolves).
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: HTTP_STATUS_NOT_FOUND });
  }

  const identity = await readVisitorIdentity();
  if (!identity.visitorId) {
    return NextResponse.json({ data: [] });
  }

  const { searchParams } = request.nextUrl;

  if (searchParams.get("action") === "clear") {
    clearActivityDebugEntries(identity.visitorId);
    clearActivityDebugEntries("__dev__");
    return NextResponse.json({ data: [] });
  }

  const since = searchParams.get("since");

  // Merge visitor-specific entries with __dev__ diagnostic entries, sorted
  // chronologically so the log reads in arrival order.
  let entries = [
    ...getActivityDebugEntries("__dev__"),
    ...getActivityDebugEntries(identity.visitorId),
  ].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  if (since) {
    entries = entries.filter((e) => e.recordedAt > since);
  }

  return NextResponse.json({ data: entries });
}
