import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getSearchPreferences,
  preferencesErrorResponse,
  type SearchPreferences,
  type SearchPreferencesPatchRequest,
  searchPreferencesPatchSchema,
  updateSearchPreferences,
} from "~/features/profile/preferences/bff";

interface SearchPreferencesEnvelope {
  data: SearchPreferences;
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: SearchPreferences): SearchPreferencesEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/profile/preferences/search/[searchId]
 *
 * Returns search-funnel-scoped preferences for the given searchId.
 * Identity is read from httpOnly cookies.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const { searchId } = await params;
    if (!(searchId && UUID_PATTERN.test(searchId))) {
      return preferencesErrorResponse({
        code: "BadRequest",
        message: "A valid UUID searchId path parameter is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await getSearchPreferences(searchId);
    if (!result.success) {
      return preferencesErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return preferencesErrorResponse({
      code: "InternalError",
      message: "Failed to load search preferences",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * PATCH /api/v1/profile/preferences/search/[searchId]
 *
 * Partially updates search-scoped preferences (internal, called by aggregator).
 * Identity is read from httpOnly cookies.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const { searchId } = await params;
    if (!(searchId && UUID_PATTERN.test(searchId))) {
      return preferencesErrorResponse({
        code: "BadRequest",
        message: "A valid UUID searchId path parameter is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const body: unknown = await request.json();
    const parsed = searchPreferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return preferencesErrorResponse({
        code: "BadRequest",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await updateSearchPreferences(
      searchId,
      parsed.data as SearchPreferencesPatchRequest
    );
    if (!result.success) {
      return preferencesErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return preferencesErrorResponse({
      code: "InternalError",
      message: "Failed to update search preferences",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
