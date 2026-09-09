import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

type CompareErrorCode = "InternalError" | "UpstreamUnavailable";

interface CompareError {
  code: CompareErrorCode;
  message: string;
  status: number;
}

function createCompareError(code: CompareErrorCode, message: string, status: number): CompareError {
  return { code, message, status };
}

function mapCaughtToCompareError(error: unknown): CompareError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createCompareError(
        "UpstreamUnavailable",
        "Compare service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createCompareError(
        "UpstreamUnavailable",
        "Compare service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createCompareError("InternalError", "Compare service returned an error", error.status);
  }
  return createCompareError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

export { type CompareError, type CompareErrorCode, createCompareError, mapCaughtToCompareError };
