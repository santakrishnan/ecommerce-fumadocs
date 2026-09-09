import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getSearches,
  type SearchSession,
  searchesErrorResponse,
} from "~/features/profile/searches/bff";

interface SearchesEnvelope {
  data: SearchSession[];
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: SearchSession[]): SearchesEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

/**
 * GET /api/v1/profile/searches
 *
 * Returns the visitor's recent search sessions, sorted by lastActiveAt desc.
 * Identity is read from cookies (httpOnly _ucmp_visitor_id / _ucmp_session_id).
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const result = await getSearches();
    if (!result.success) {
      return searchesErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return searchesErrorResponse({
      code: "InternalError",
      message: "Failed to load searches",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
