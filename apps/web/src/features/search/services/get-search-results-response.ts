import "server-only";

import {
  type GetSearchResultsResult,
  getSearchResults as getSearchResultsUseCase,
  searchRequestSchema,
} from "@features/search/bff";
import { createSearchError } from "@features/search/bff/errors/search.errors";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_REQUEST } from "@shared/lib/http/status-codes";

export interface GetSearchResultsResponseInput {
  identity?: BedVisitorIdentity;
  request?: unknown;
  traceId?: string;
}

/** Shared Search Results use case — single validated contract owner. */
export async function getSearchResultsResponse(
  input: GetSearchResultsResponseInput = {}
): Promise<GetSearchResultsResult> {
  const traceId = input.traceId ?? crypto.randomUUID();
  const identity = input.identity ?? {};
  const parsedRequest = searchRequestSchema.safeParse(input.request ?? {});

  if (!parsedRequest.success) {
    return {
      success: false,
      error: createSearchError(
        "SEARCH_VALIDATION_FAILED",
        "Invalid request body",
        HTTP_STATUS_BAD_REQUEST
      ),
    };
  }

  const result = await getSearchResultsUseCase(parsedRequest.data, traceId, identity);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data,
  };
}
