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
 * BFF-layer error codes for the autocomplete domain.
 *
 * The base is the upstream SDK's `ErrorDetailCodeEnumKey`. BFF-only codes that
 * have no SDK equivalent are appended as local augmentations.
 */
export type AutocompleteErrorCode =
  | ErrorDetailCodeEnumKey
  | "AUTOCOMPLETE_VALIDATION_FAILED"
  | "AUTOCOMPLETE_INTERNAL_ERROR";

export interface AutocompleteError {
  code: AutocompleteErrorCode;
  message: string;
  status: number;
}

export function createAutocompleteError(
  code: AutocompleteErrorCode,
  message: string,
  status: number
): AutocompleteError {
  return { code, message, status };
}

/**
 * Map a caught error to a structured AutocompleteError.
 * Use in the catch block of any autocomplete upstream service.
 */
export function mapCaughtToAutocompleteError(error: unknown): AutocompleteError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape: { error: ErrorDetail, meta: Meta }
    const body = error.body as Record<string, unknown> | undefined;
    const errorDetail = body?.error;
    if (isValidErrorDetail(errorDetail)) {
      return createAutocompleteError(
        errorDetail.code as AutocompleteErrorCode,
        errorDetail.message,
        error.status
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createAutocompleteError(
        "ServiceUnavailable",
        "Autocomplete service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createAutocompleteError(
        "ServiceUnavailable",
        "Autocomplete service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createAutocompleteError(
      "InternalError",
      "Autocomplete service returned an error",
      error.status
    );
  }

  return createAutocompleteError(
    "AUTOCOMPLETE_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

// Pre-built singleton constants for convenience at call sites.
// NOTE: Follow-up ticket to evaluate whether these add value vs. inline creation.
export const AUTOCOMPLETE_VALIDATION_ERROR: AutocompleteError = createAutocompleteError(
  "AUTOCOMPLETE_VALIDATION_FAILED",
  "Request validation failed",
  HTTP_STATUS_BAD_REQUEST
);

export const AUTOCOMPLETE_UPSTREAM_UNAVAILABLE_ERROR: AutocompleteError = createAutocompleteError(
  "ServiceUnavailable",
  "Autocomplete service is currently unavailable",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

export const AUTOCOMPLETE_INTERNAL_ERROR: AutocompleteError = createAutocompleteError(
  "AUTOCOMPLETE_INTERNAL_ERROR",
  "An unexpected error occurred",
  HTTP_STATUS_INTERNAL_SERVER_ERROR
);
