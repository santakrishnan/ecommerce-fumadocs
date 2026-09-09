import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { ErrorDetailCodeEnumKey } from "@ucmp/sdk-search-api";
import { isValidErrorDetail } from "./sdk-error-detail.guard";

/**
 * BFF-layer error codes for the search-recent domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey`. BFF-only codes that
 * have no SDK equivalent are appended as local augmentations.
 */
export type SearchRecentErrorCode =
  | ErrorDetailCodeEnumKey
  | "SEARCH_RECENT_VALIDATION_FAILED"
  | "SEARCH_RECENT_INTERNAL_ERROR";

export interface SearchRecentError {
  code: SearchRecentErrorCode;
  message: string;
  status: number;
}

export function createSearchRecentError(
  code: SearchRecentErrorCode,
  message: string,
  status: number
): SearchRecentError {
  return { code, message, status };
}

export function mapCaughtToSearchRecentError(error: unknown): SearchRecentError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createSearchRecentError(
        errorDetail.code as SearchRecentErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createSearchRecentError(
        "ServiceUnavailable",
        "Search recent service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createSearchRecentError(
        "ServiceUnavailable",
        "Search recent service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createSearchRecentError(
      "InternalError",
      "Search recent service returned an error",
      error.status
    );
  }

  return createSearchRecentError(
    "SEARCH_RECENT_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
