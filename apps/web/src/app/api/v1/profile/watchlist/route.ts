import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  addToWatchlist,
  addToWatchlistRequestSchema,
  getWatchlist,
  type WatchlistItem,
  watchlistErrorResponse,
} from "~/features/profile/watchlist/bff";

interface WatchlistEnvelope {
  data: WatchlistItem[];
  meta: { traceId: string; timestamp: string };
}

function envelope(traceId: string, data: WatchlistItem[]): WatchlistEnvelope {
  return { data, meta: { traceId, timestamp: new Date().toISOString() } };
}

/**
 * GET /api/v1/profile/watchlist — the visitor's saved vehicles (server source of truth).
 * The visitor is identified server-side from the httpOnly `_ucmp_visitor_id`
 * cookie, so no client-passed id is required.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const result = await getWatchlist();
    if (!result.success) {
      return watchlistErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data));
  } catch {
    return watchlistErrorResponse({
      code: "InternalError",
      message: "Failed to load watchlist",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * POST /api/v1/profile/watchlist — add a vehicle; returns the full updated list so the
 * client can reconcile its IndexedDB cache in one round-trip.
 */
export async function POST(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id")?.trim() || crypto.randomUUID();
  try {
    const body: unknown = await request.json();
    const parsed = addToWatchlistRequestSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[watchlist POST] validation failed:", parsed.error.issues);
      return watchlistErrorResponse({
        code: "BadRequest",
        message: "Invalid request body",
        status: HTTP_STATUS_BAD_REQUEST,
      });
    }

    const result = await addToWatchlist(parsed.data);
    if (!result.success) {
      return watchlistErrorResponse(result.error);
    }
    return NextResponse.json(envelope(traceId, result.data), { status: HTTP_STATUS_CREATED });
  } catch {
    return watchlistErrorResponse({
      code: "InternalError",
      message: "Failed to add to watchlist",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  }
}
