import {
  getSearchRecent,
  type SearchRecentResponse,
  searchRecentErrorResponse,
  searchRecentRequestSchema,
} from "@features/search/bff";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/search/recent
 *
 * Returns recent search suggestions for the visitor.
 * Optional visitor identification via the `X-Visitor-Id` request header.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = searchRecentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return searchRecentErrorResponse({
        code: "SEARCH_RECENT_VALIDATION_FAILED",
        message: "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const visitorId = request.headers.get("X-Visitor-Id") ?? undefined;
    const result = await getSearchRecent(parsed.data, visitorId);

    if (!result.success) {
      return searchRecentErrorResponse(result.error);
    }

    return NextResponse.json<SearchRecentResponse>(result.data);
  } catch {
    return searchRecentErrorResponse({
      code: "SEARCH_RECENT_INTERNAL_ERROR",
      message: "Failed to fetch search recent",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
