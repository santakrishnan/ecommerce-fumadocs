import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { ErrorDetailCodeEnumKey } from "@ucmp/sdk-search-api";
import { isValidErrorDetail } from "./sdk-error-detail.guard";

/**
 * BFF-layer error codes for the search-suggestions domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey`. BFF-only codes that
 * have no SDK equivalent are appended as local augmentations.
 */
export type SearchSuggestionsErrorCode =
  | ErrorDetailCodeEnumKey
  | "SEARCH_SUGGESTIONS_VALIDATION_FAILED"
  | "SEARCH_SUGGESTIONS_INTERNAL_ERROR";

export interface SearchSuggestionsError {
  code: SearchSuggestionsErrorCode;
  message: string;
  status: number;
}

export function createSearchSuggestionsError(
  code: SearchSuggestionsErrorCode,
  message: string,
  status: number
): SearchSuggestionsError {
  return { code, message, status };
}

export function mapCaughtToSearchSuggestionsError(error: unknown): SearchSuggestionsError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createSearchSuggestionsError(
        errorDetail.code as SearchSuggestionsErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createSearchSuggestionsError(
        "ServiceUnavailable",
        "Search suggestions service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createSearchSuggestionsError(
        "ServiceUnavailable",
        "Search suggestions service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createSearchSuggestionsError(
      "InternalError",
      "Search suggestions service returned an error",
      error.status
    );
  }

  return createSearchSuggestionsError(
    "SEARCH_SUGGESTIONS_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
