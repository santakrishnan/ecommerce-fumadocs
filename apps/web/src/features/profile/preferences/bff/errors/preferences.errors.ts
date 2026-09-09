import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import { NextResponse } from "next/server";

export type PreferencesErrorCode = "BadRequest" | "NotFound" | "Unauthorized" | "InternalError";

export interface PreferencesError {
  code: PreferencesErrorCode;
  message: string;
  status: number;
}

export interface PreferencesErrorBody {
  error: { code: PreferencesErrorCode; message: string };
}

export function createPreferencesError(
  code: PreferencesErrorCode,
  message: string,
  status: number
): PreferencesError {
  return { code, message, status };
}

export function mapCaughtToPreferencesError(error: unknown): PreferencesError {
  if (error instanceof ServerHttpError) {
    const body = error.body as Record<string, unknown> | undefined;
    if (body && typeof body.error === "string" && typeof body.message === "string") {
      return createPreferencesError(
        body.error as PreferencesErrorCode,
        body.message,
        error.status || HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createPreferencesError(
        "InternalError",
        "Preferences service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createPreferencesError(
        "InternalError",
        "Preferences service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 404) {
      return createPreferencesError("NotFound", "Preferences not found", HTTP_STATUS_NOT_FOUND);
    }
    return createPreferencesError(
      "InternalError",
      "Preferences service returned an error",
      error.status
    );
  }
  return createPreferencesError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

export function preferencesErrorResponse(
  error: PreferencesError
): NextResponse<PreferencesErrorBody> {
  return NextResponse.json<PreferencesErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
