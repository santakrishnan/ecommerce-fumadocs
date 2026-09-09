"use cache";

import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { SearchRecentRequest } from "../contracts/search-recent-request.schema";
import type { SearchRecentResponse } from "../contracts/search-recent-response.schema";
import type { SearchRecentError } from "../errors/search-recent.errors";
import { fetchSearchRecent } from "./search-recent-upstream";

type FetchSearchRecentResult =
  | { success: true; data: SearchRecentResponse }
  | { success: false; error: SearchRecentError };

/**
 * Cached wrapper around the upstream search recent call.
 * Kept in its own server-only module so the cache boundary does not leak into
 * broader import graphs.
 */
export async function fetchSearchRecentCached(
  baseUrl: string,
  request: SearchRecentRequest,
  visitorId: string | undefined
): Promise<FetchSearchRecentResult> {
  cacheLife("search");
  cacheTag("search-recent", `search-recent:${visitorId ?? "anonymous"}`);

  return fetchSearchRecent(baseUrl, request, visitorId);
}
