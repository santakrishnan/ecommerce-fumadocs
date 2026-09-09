import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { SearchResultsApiResponse } from "../contracts/search-response.schema";
import { createSearchError, type SearchError } from "../errors/search.errors";
import { mockSearchResults } from "../services/search-mock";
import { fetchSearchUpstream, type UpstreamSearchRequest } from "../services/search-upstream";

export type GetSearchResultsResult =
  | { success: true; data: SearchResultsApiResponse }
  | { success: false; error: SearchError };

/**
 * Use case: fetch vehicle search results for POST /api/v1/search.
 *
 * Accepts `UpstreamSearchRequest` which extends `SearchRequest` with an
 * optional `identifierFilters` field for internal callers (e.g. taxonomy action).
 *
 * - `USE_SEARCH_RESULTS_MOCKS=true`                                   → returns fixture data (always wins)
 * - `API_UPSTREAM_URL` + `SEARCH_API_KEY` set via resolveBedService   → calls the BED search API
 * - Service not resolved                                               → 503 (misconfiguration)
 */
export async function getSearchResults(
  request: UpstreamSearchRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<GetSearchResultsResult> {
  if (env.USE_SEARCH_RESULTS_MOCKS === "true") {
    return mockSearchResults(request, traceId);
  }

  const service = resolveBedService("search");
  if (!service) {
    return {
      success: false,
      error: createSearchError(
        "ServiceUnavailable",
        "Search upstream service is not configured (API_UPSTREAM_URL + SEARCH_API_KEY)",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  return fetchSearchUpstream(service, request, traceId, identity);
}
