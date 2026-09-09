import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type SearchSession,
  searchesErrorResponse,
  updateSearch,
  updateSearchRequestSchema,
} from "~/features/profile/searches/bff";

interface SearchSessionEnvelope {
  data: SearchSession;
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: SearchSession): SearchSessionEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/v1/profile/searches/[searchId]
 *
 * Updates a search session: pin/unpin (isSaved) or rename (name).
 * Identity is read from cookies (httpOnly _ucmp_visitor_id / _ucmp_session_id).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const { searchId } = await params;
    if (!(searchId && UUID_PATTERN.test(searchId))) {
      return searchesErrorResponse({
        code: "BadRequest",
        message: "A valid UUID searchId path parameter is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const body: unknown = await request.json();
    const parsed = updateSearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return searchesErrorResponse({
        code: "BadRequest",
        message: "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await updateSearch(searchId, parsed.data);
    if (!result.success) {
      return searchesErrorResponse(result.error);
    }

    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return searchesErrorResponse({
      code: "InternalError",
      message: "Failed to update search session",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
