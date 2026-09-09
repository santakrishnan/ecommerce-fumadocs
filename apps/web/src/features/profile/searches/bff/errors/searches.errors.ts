import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import { NextResponse } from "next/server";

export type SearchesErrorCode =
  | "BadRequest"
  | "NotFound"
  | "Unauthorized"
  | "InternalError"
  | "SEARCHES_NOT_FOUND";

export interface SearchesError {
  code: SearchesErrorCode;
  message: string;
  status: number;
}

export interface SearchesErrorBody {
  error: { code: SearchesErrorCode; message: string };
}

export function createSearchesError(
  code: SearchesErrorCode,
  message: string,
  status: number
): SearchesError {
  return { code, message, status };
}

export function mapCaughtToSearchesError(error: unknown): SearchesError {
  if (error instanceof ServerHttpError) {
    const body = error.body as Record<string, unknown> | undefined;
    if (body && typeof body.error === "string" && typeof body.message === "string") {
      return createSearchesError(
        body.error as SearchesErrorCode,
        body.message,
        error.status || HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createSearchesError(
        "InternalError",
        "Searches service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createSearchesError(
        "InternalError",
        "Searches service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 404) {
      return createSearchesError(
        "SEARCHES_NOT_FOUND",
        "Search session not found",
        HTTP_STATUS_NOT_FOUND
      );
    }
    return createSearchesError("InternalError", "Searches service returned an error", error.status);
  }
  return createSearchesError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

export function searchesErrorResponse(error: SearchesError): NextResponse<SearchesErrorBody> {
  return NextResponse.json<SearchesErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
