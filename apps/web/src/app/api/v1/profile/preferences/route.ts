import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getLifetimePreferences,
  type LifetimePreferences,
  type LifetimePreferencesPatchRequest,
  lifetimePreferencesPatchSchema,
  preferencesErrorResponse,
  updateLifetimePreferences,
} from "~/features/profile/preferences/bff";

interface PreferencesEnvelope {
  data: LifetimePreferences;
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: LifetimePreferences): PreferencesEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

/**
 * GET /api/v1/profile/preferences
 *
 * Returns the visitor's lifetime preferences (cross-session aggregation).
 * Identity is read from httpOnly cookies.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const result = await getLifetimePreferences();
    if (!result.success) {
      return preferencesErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return preferencesErrorResponse({
      code: "InternalError",
      message: "Failed to load preferences",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * PATCH /api/v1/profile/preferences
 *
 * Partially updates lifetime preferences (internal, called by aggregator).
 * Identity is read from httpOnly cookies.
 */
export async function PATCH(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const body: unknown = await request.json();
    const parsed = lifetimePreferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return preferencesErrorResponse({
        code: "BadRequest",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await updateLifetimePreferences(parsed.data as LifetimePreferencesPatchRequest);
    if (!result.success) {
      return preferencesErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return preferencesErrorResponse({
      code: "InternalError",
      message: "Failed to update preferences",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
