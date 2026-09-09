import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { SearchSuggestionsResponse } from "../contracts";
import {
  createSearchSuggestionsError,
  type SearchSuggestionsError,
} from "../errors/search-suggestions.errors";
import { mockSearchSuggestions } from "../services/search-suggestions-mock";
import {
  fetchSearchSuggestionsCached,
  type SearchSuggestionsRequestContext,
} from "../services/search-suggestions-upstream";

export type GetSearchSuggestionsResult =
  | { success: true; data: SearchSuggestionsResponse }
  | { success: false; error: SearchSuggestionsError };

/**
 * Use case: fetch entry-state Search page suggestions.
 *
 * - When API_UPSTREAM_URL is set → calls the real upstream /search/suggestions
 * - When USE_SEARCH_MOCKS is "true" → returns mock data
 * - Otherwise → fails fast with 503
 */
export async function getSearchSuggestions(
  context?: SearchSuggestionsRequestContext
): Promise<GetSearchSuggestionsResult> {
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (upstreamUrl) {
    return fetchSearchSuggestionsCached(upstreamUrl, {}, context);
  }

  if (env.USE_SEARCH_MOCKS === "true") {
    const data = await mockSearchSuggestions();
    return { success: true, data };
  }

  return {
    success: false,
    error: createSearchSuggestionsError(
      "ServiceUnavailable",
      "API_UPSTREAM_URL is not configured and USE_SEARCH_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
