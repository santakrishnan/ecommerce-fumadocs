import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { cacheLife, cacheTag } from "next/cache";
import type { SearchSuggestionsRequest, SearchSuggestionsResponse } from "../contracts";
import {
  searchSuggestionsResponseSchema,
  searchSuggestionsUpstreamResponseSchema,
} from "../contracts";
import {
  createSearchSuggestionsError,
  mapCaughtToSearchSuggestionsError,
  type SearchSuggestionsError,
} from "../errors/search-suggestions.errors";
import { mapSearchSuggestionsUpstreamToResponse } from "../mappers/search-suggestions.mapper";
import { createSearchSuggestionsClient } from "./search-suggestions-client";

export interface SearchSuggestionsRequestContext {
  sessionId?: string;
  tenantId?: string;
  visitorId?: string;
}

type FetchSearchSuggestionsResult =
  | { success: true; data: SearchSuggestionsResponse }
  | { success: false; error: SearchSuggestionsError };

async function fetchSearchSuggestions(
  baseUrl: string,
  request: SearchSuggestionsRequest,
  context?: SearchSuggestionsRequestContext
): Promise<FetchSearchSuggestionsResult> {
  const client = createSearchSuggestionsClient(baseUrl);

  try {
    const raw = await client.get("/search/suggestions", {
      ids: {
        sessionId: context?.sessionId,
        tenantId: context?.tenantId,
        visitorId: context?.visitorId,
      },
      params: {
        ...(request.query ? { query: request.query } : {}),
        ...(request.searchId ? { searchId: request.searchId } : {}),
      },
    });

    const parsed = searchSuggestionsUpstreamResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: createSearchSuggestionsError(
          "InternalError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapSearchSuggestionsUpstreamToResponse(parsed.data);
    const validated = searchSuggestionsResponseSchema.safeParse(mapped);

    if (!validated.success) {
      return {
        success: false,
        error: createSearchSuggestionsError(
          "InternalError",
          "Mapped response violates the BFF response contract",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    return { success: false, error: mapCaughtToSearchSuggestionsError(error) };
  }
}

export async function fetchSearchSuggestionsCached(
  baseUrl: string,
  request: SearchSuggestionsRequest,
  context?: SearchSuggestionsRequestContext
): Promise<FetchSearchSuggestionsResult> {
  "use cache";
  cacheLife("search");
  cacheTag("search-suggestions", "search-suggestions:entry");

  return fetchSearchSuggestions(baseUrl, request, context);
}
