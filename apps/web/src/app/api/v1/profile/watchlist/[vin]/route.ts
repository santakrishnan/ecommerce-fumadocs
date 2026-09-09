import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VIN_PATTERN } from "utils/validators";
import { removeFromWatchlist, watchlistErrorResponse } from "~/features/profile/watchlist/bff";

/**
 * DELETE /api/v1/profile/watchlist/{vin} — remove a vehicle from the visitor's watchlist.
 * Returns 204 No Content on success (mirrors the upstream).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    const normalizedVin = vin.trim().toUpperCase();
    if (!normalizedVin) {
      return watchlistErrorResponse({
        code: "BadRequest",
        message: "A VIN path parameter is required",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }
    if (!VIN_PATTERN.test(normalizedVin)) {
      return watchlistErrorResponse({
        code: "BadRequest",
        message: "Invalid VIN format",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await removeFromWatchlist(normalizedVin);
    if (!result.success) {
      return watchlistErrorResponse(result.error);
    }
    return new NextResponse(null, { status: HTTP_STATUS_NO_CONTENT });
  } catch {
    return watchlistErrorResponse({
      code: "InternalError",
      message: "Failed to remove from watchlist",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
