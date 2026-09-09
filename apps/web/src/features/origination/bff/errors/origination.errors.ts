import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

/**
 * BFF-layer error codes for the origination domain.
 *
 * Origination has no upstream SDK yet, so — unlike the search domain, which
 * bases its union on the generated `ErrorDetailCodeEnumKey` — the code union is
 * defined locally. When the OpenAPI spec lands and a generated error enum
 * exists, fold it in here (the factory + `Result` shape stay put).
 *
 * Codes are PascalCase for HTTP-semantic mappings (aligned with the search
 * domain's SDK-derived codes) plus explicit domain augmentations for validation
 * and unexpected upstream shapes.
 */
export type OriginationErrorCode =
  | "ValidationFailed"
  | "NotFound"
  | "ServiceUnavailable"
  | "UpstreamError"
  | "InternalError";

export interface OriginationError {
  code: OriginationErrorCode;
  message: string;
  status: number;
}

/**
 * Construct a typed origination error. This is the single per-domain factory
 * every origination endpoint reuses (FND-01) — endpoints never build the
 * `{ code, message, status }` object inline.
 */
export function createOriginationError(
  code: OriginationErrorCode,
  message: string,
  status: number
): OriginationError {
  return { code, message, status };
}

/**
 * Map a caught error (typically from a BED upstream call) to a typed
 * `OriginationError`. Never surfaces raw upstream bodies or PII — only a stable
 * code + generic message + status the route handler can serialize safely.
 */
export function mapCaughtToOriginationError(error: unknown): OriginationError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createOriginationError(
        "ServiceUnavailable",
        "Origination service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createOriginationError(
        "ServiceUnavailable",
        "Origination service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createOriginationError(
      "UpstreamError",
      "Origination service returned an error",
      error.status
    );
  }

  return createOriginationError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
