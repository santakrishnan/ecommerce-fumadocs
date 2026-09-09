import "server-only";

import { resolveBedService } from "@config/bed-services";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { SearchSession, UpdateSearchRequest } from "../contracts/search-session.schema";
import { createSearchesError, type SearchesError } from "../errors/searches.errors";
import { fetchSearches, patchSearchSession } from "../services/searches-upstream";

export type GetSearchesResult =
  | { success: true; data: SearchSession[] }
  | { success: false; error: SearchesError };

export type UpdateSearchResult =
  | { success: true; data: SearchSession }
  | { success: false; error: SearchesError };

const NOT_CONFIGURED = createSearchesError(
  "InternalError",
  "Visitors upstream service is not configured (API_UPSTREAM_URL + VISITORS_API_KEY)",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

/**
 * Use case: list visitor's search sessions.
 * Resolves the visitors BED service and reads identity from cookies.
 */
export async function getSearches(): Promise<GetSearchesResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return fetchSearches(visitors, identity);
}

/**
 * Use case: update a search session (pin/unpin, rename).
 * Resolves the visitors BED service and reads identity from cookies.
 */
export async function updateSearch(
  searchId: string,
  request: UpdateSearchRequest
): Promise<UpdateSearchResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return patchSearchSession(visitors, searchId, request, identity);
}
