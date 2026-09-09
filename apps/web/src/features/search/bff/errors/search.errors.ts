import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { ErrorDetailCodeEnumKey } from "@ucmp/sdk-search-api";
import { isValidErrorDetail } from "./sdk-error-detail.guard";

/**
 * BFF-layer error codes for the search domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey` (e.g. "NotFound",
 * "ServiceUnavailable", "InternalError", …). BFF-only codes that have no SDK
 * equivalent are appended as local augmentations.
 */
export type SearchErrorCode =
  | ErrorDetailCodeEnumKey
  | "SEARCH_VALIDATION_FAILED"
  | "SEARCH_INTERNAL_ERROR";

export interface SearchError {
  code: SearchErrorCode;
  message: string;
  status: number;
}

export function createSearchError(
  code: SearchErrorCode,
  message: string,
  status: number
): SearchError {
  return { code, message, status };
}

export function mapCaughtToSearchError(error: unknown): SearchError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createSearchError(
        errorDetail.code as SearchErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createSearchError(
        "ServiceUnavailable",
        "Search service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createSearchError(
        "ServiceUnavailable",
        "Search service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createSearchError("InternalError", "Search service returned an error", error.status);
  }

  return createSearchError(
    "SEARCH_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
