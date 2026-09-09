/**
 * Watchlist error types and helpers.
 *
 * Error codes are derived from the upstream SDK's `ErrorResponse.error` enum
 * (`@ucmp/sdk-visitor-profile-api`) plus a BFF-layer "not found" case.
 * No coupling to the profile feature module.
 */

import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import type { ErrorResponseErrorEnumKey } from "@ucmp/sdk-visitor-profile-api";
import { NextResponse } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────

/** BFF-level error codes: upstream SDK codes + a local "not found" variant. */
export type WatchlistErrorCode = ErrorResponseErrorEnumKey | "WATCHLIST_NOT_FOUND";

export interface WatchlistError {
  code: WatchlistErrorCode;
  message: string;
  status: number;
}

export interface WatchlistErrorBody {
  error: { code: WatchlistErrorCode; message: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function createWatchlistError(
  code: WatchlistErrorCode,
  message: string,
  status: number
): WatchlistError {
  return { code, message, status };
}

/**
 * Maps a caught error to a WatchlistError.
 *
 * When the upstream returns a structured error body (SDK `ErrorResponse` shape:
 * `{ error, message, details?, meta? }`), we extract the code and message
 * directly — preserving the upstream's machine-readable code for the client.
 */
export function mapCaughtToWatchlistError(error: unknown): WatchlistError {
  if (error instanceof ServerHttpError) {
    // Try to extract the upstream SDK error body shape.
    const body = error.body as Record<string, unknown> | undefined;
    if (body && typeof body.error === "string" && typeof body.message === "string") {
      return createWatchlistError(
        body.error as WatchlistErrorCode,
        body.message,
        error.status || HTTP_STATUS_BAD_GATEWAY
      );
    }

    // Fallback: no structured body — map from HTTP semantics.
    if (error.status === 0 && error.code === "TIMEOUT") {
      return createWatchlistError(
        "InternalError",
        "Watchlist service request timed out",
        HTTP_STATUS_GATEWAY_TIMEOUT
      );
    }
    if (error.status === 0) {
      return createWatchlistError(
        "InternalError",
        "Watchlist service is currently unavailable",
        HTTP_STATUS_BAD_GATEWAY
      );
    }
    if (error.status === 404) {
      return createWatchlistError(
        "WATCHLIST_NOT_FOUND",
        "Vehicle not found in watchlist",
        HTTP_STATUS_NOT_FOUND
      );
    }
    return createWatchlistError(
      "InternalError",
      "Watchlist service returned an error",
      error.status
    );
  }
  return createWatchlistError(
    "InternalError",
    "An unexpected error occurred",
    HTTP_STATUS_INTERNAL_SERVER_ERROR
  );
}

/** Produce a typed JSON error response for watchlist route handlers. */
export function watchlistErrorResponse(error: WatchlistError): NextResponse<WatchlistErrorBody> {
  return NextResponse.json<WatchlistErrorBody>(
    { error: { code: error.code, message: error.message } },
    { status: error.status }
  );
}
