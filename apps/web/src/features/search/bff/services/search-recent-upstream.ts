import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { SearchRecentRequest } from "../contracts/search-recent-request.schema";
import type { SearchRecentResponse } from "../contracts/search-recent-response.schema";
import {
  searchRecentResponseSchema,
  searchRecentUpstreamResponseSchema,
} from "../contracts/search-recent-response.schema";
import {
  createSearchRecentError,
  mapCaughtToSearchRecentError,
  type SearchRecentError,
} from "../errors/search-recent.errors";
import { mapSearchRecentUpstreamToResponse } from "../mappers/search-recent.mapper";
import { createSearchRecentClient } from "./search-recent-client";

type FetchSearchRecentResult =
  | { success: true; data: SearchRecentResponse }
  | { success: false; error: SearchRecentError };

export async function fetchSearchRecent(
  baseUrl: string,
  _request: SearchRecentRequest,
  visitorId: string | undefined
): Promise<FetchSearchRecentResult> {
  const client = createSearchRecentClient(baseUrl);

  try {
    const raw = await client.post("/search/recent", undefined, {
      headers: { ...(visitorId && { "X-Visitor-Id": visitorId }) },
    });

    const parsed = searchRecentUpstreamResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: createSearchRecentError(
          "InternalError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapSearchRecentUpstreamToResponse(parsed.data);
    const validated = searchRecentResponseSchema.safeParse(mapped);

    if (!validated.success) {
      return {
        success: false,
        error: createSearchRecentError(
          "InternalError",
          "Mapped response violates the BFF response contract",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    return { success: false, error: mapCaughtToSearchRecentError(error) };
  }
}
