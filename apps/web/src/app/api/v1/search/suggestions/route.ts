import {
  getSearchSuggestions,
  type SearchSuggestionsResponse,
  searchSuggestionsErrorResponse,
} from "@features/search/bff";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/search/suggestions
 *
 * Returns entry-state suggestions.
 * Forwards X-Session-Id, X-Tenant-Id, and X-Visitor-Id to the upstream call.
 */
export async function GET(request: NextRequest) {
  try {
    const context = {
      sessionId: request.headers.get("X-Session-Id") ?? undefined,
      tenantId: request.headers.get("X-Tenant-Id") ?? undefined,
      visitorId: request.headers.get("X-Visitor-Id") ?? undefined,
    };

    const result = await getSearchSuggestions(context);

    if (!result.success) {
      return searchSuggestionsErrorResponse(result.error);
    }

    return NextResponse.json<SearchSuggestionsResponse>(result.data);
  } catch {
    return searchSuggestionsErrorResponse({
      code: "SEARCH_SUGGESTIONS_INTERNAL_ERROR",
      message: "Failed to fetch search suggestions",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
