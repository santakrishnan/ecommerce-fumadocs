import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import { NextResponse } from "next/server";

export type ActivitiesErrorCode = "BadRequest" | "Unauthorized" | "InternalError";

export interface ActivitiesError {
  code: ActivitiesErrorCode;
  message: string;
  status: number;
}

export interface ActivitiesErrorBody {
  error: { code: ActivitiesErrorCode; message: string };
}

export function createActivitiesError(
  code: ActivitiesErrorCode,
  message: string,
  status: number
): ActivitiesError {
  return { code, message, status };
}

export function mapCaughtToActivitiesError(error: unknown): ActivitiesError {
  if (error instanceof ServerHttpError) {
    const body = error.body as Record<string, unknown> | undefined;
    if (body && typeof body.error === "string" && typeof body.message === "string") {
      return createActivitiesError(
        body.error as ActivitiesErrorCode,
        body.message,
        error.status || HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createActivitiesError(
        "InternalError",
        "Activities service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createActivitiesError(
        "InternalError",
        "Activities service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    return createActivitiesError(
      "InternalError",
      "Activities service returned an error",
      error.status
    );
  }
  return createActivitiesError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

export function activitiesErrorResponse(error: ActivitiesError): NextResponse<ActivitiesErrorBody> {
  return NextResponse.json<ActivitiesErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
