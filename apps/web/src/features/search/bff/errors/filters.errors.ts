import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@shared/lib/http/status-codes";
import type { ErrorDetailCodeEnumKey } from "@ucmp/sdk-search-api";
import { isValidErrorDetail } from "./sdk-error-detail.guard";

/**
 * BFF-layer error codes for the filters domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey`. BFF-only codes that
 * have no SDK equivalent are appended as local augmentations.
 */
export type FiltersErrorCode =
  | ErrorDetailCodeEnumKey
  | "FILTERS_VALIDATION_FAILED"
  | "FILTERS_INTERNAL_ERROR";

export interface FiltersError {
  code: FiltersErrorCode;
  message: string;
  status: number;
}

export function createFiltersError(
  code: FiltersErrorCode,
  message: string,
  status: number
): FiltersError {
  return { code, message, status };
}

/**
 * Map a caught error to a structured FiltersError.
 * Use in the catch block of any filters upstream service.
 */
export function mapCaughtToFiltersError(error: unknown): FiltersError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createFiltersError(
        errorDetail.code as FiltersErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createFiltersError(
        "ServiceUnavailable",
        "Filters service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createFiltersError(
        "ServiceUnavailable",
        "Filters service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createFiltersError("InternalError", "Filters service returned an error", error.status);
  }

  return createFiltersError(
    "FILTERS_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

// Pre-built singleton constants for convenience at call sites.
// NOTE: Follow-up ticket to evaluate whether these add value vs. inline creation.
export const FILTERS_VALIDATION_ERROR: FiltersError = createFiltersError(
  "FILTERS_VALIDATION_FAILED",
  "Request validation failed",
  HTTP_STATUS_BAD_REQUEST
);

export const FILTERS_UPSTREAM_UNAVAILABLE_ERROR: FiltersError = createFiltersError(
  "ServiceUnavailable",
  "Filters service is currently unavailable",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

export const FILTERS_INTERNAL_ERROR: FiltersError = createFiltersError(
  "FILTERS_INTERNAL_ERROR",
  "An unexpected error occurred",
  HTTP_STATUS_INTERNAL_SERVER_ERROR
);
