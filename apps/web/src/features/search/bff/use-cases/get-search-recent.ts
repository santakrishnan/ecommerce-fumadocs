import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { SearchRecentRequest } from "../contracts/search-recent-request.schema";
import type { SearchRecentResponse } from "../contracts/search-recent-response.schema";
import { createSearchRecentError, type SearchRecentError } from "../errors/search-recent.errors";
import { mockSearchRecent } from "../services/search-recent-mock";
import { fetchSearchRecentCached } from "../services/search-recent-upstream-cached";

export type GetSearchRecentResult =
  | { success: true; data: SearchRecentResponse }
  | { success: false; error: SearchRecentError };

/**
 * Use case: fetch recent search suggestions for a visitor.
 * visitorId is forwarded to the upstream as the X-Visitor-Id header.
 *
 * - When API_UPSTREAM_URL is set → calls the real upstream /search/recent
 * - When USE_PROFILE_SEARCH_MOCKS is "true" → returns mock data
 * - Otherwise → fails fast with 503
 */
export async function getSearchRecent(
  request: SearchRecentRequest,
  visitorId: string | undefined
): Promise<GetSearchRecentResult> {
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (env.USE_PROFILE_SEARCH_MOCKS === "true") {
    const data = await mockSearchRecent();
    return { success: true, data };
  }

  if (upstreamUrl) {
    return fetchSearchRecentCached(upstreamUrl, request, visitorId);
  }

  return {
    success: false,
    error: createSearchRecentError(
      "ServiceUnavailable",
      "API_UPSTREAM_URL is not configured and USE_PROFILE_SEARCH_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
