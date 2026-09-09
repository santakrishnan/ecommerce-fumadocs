import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";

export type ProfileErrorCode =
  | "PROFILE_UPSTREAM_UNAVAILABLE"
  | "PROFILE_UPSTREAM_ERROR"
  | "PROFILE_VALIDATION_FAILED"
  | "PROFILE_INTERNAL_ERROR";

export interface ProfileError {
  code: ProfileErrorCode;
  message: string;
  status: number;
}

export function createProfileError(
  code: ProfileErrorCode,
  message: string,
  status: number
): ProfileError {
  return { code, message, status };
}

export function mapCaughtToProfileError(error: unknown): ProfileError {
  if (error instanceof ServerHttpError) {
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createProfileError(
        "PROFILE_UPSTREAM_UNAVAILABLE",
        "Profile service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createProfileError(
        "PROFILE_UPSTREAM_UNAVAILABLE",
        "Profile service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createProfileError(
      "PROFILE_UPSTREAM_ERROR",
      "Profile service returned an error",
      error.status
    );
  }
  return createProfileError(
    "PROFILE_INTERNAL_ERROR",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}
