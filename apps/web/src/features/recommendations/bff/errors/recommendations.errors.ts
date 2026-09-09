import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

export type RecommendationsErrorCode =
  | "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE"
  | "RECOMMENDATIONS_UPSTREAM_ERROR"
  | "RECOMMENDATIONS_VALIDATION_FAILED"
  | "RECOMMENDATIONS_INTERNAL_ERROR";

export interface RecommendationsError {
  code: RecommendationsErrorCode;
  message: string;
  status: number;
}

export function createRecommendationsError(
  code: RecommendationsErrorCode,
  message: string,
  status: number
): RecommendationsError {
  return { code, message, status };
}

export function mapCaughtToRecommendationsError(error: unknown): RecommendationsError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createRecommendationsError(
        "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE",
        "Recommendations service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createRecommendationsError(
        "RECOMMENDATIONS_UPSTREAM_UNAVAILABLE",
        "Recommendations service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createRecommendationsError(
      "RECOMMENDATIONS_UPSTREAM_ERROR",
      "Recommendations service returned an error",
      error.status
    );
  }
  return createRecommendationsError(
    "RECOMMENDATIONS_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
