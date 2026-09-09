import "client-only";

import { API_ROUTES } from "@config/routes";
import { createHttpClient } from "@shared/lib/http/client-api";
import type { AddToWatchlistRequest, WatchlistItem } from "../contracts/watchlist-item.schema";

/**
 * Browser client for our own BFF watchlist routes, via the shared http lib
 * (`createHttpClient`) rather than a hand-rolled `fetch`. This gives these calls
 * retry/timeout, `credentials: "include"` (httpOnly identity cookies), and a
 * structured `ClientHttpError` on failure. Full `API_ROUTES` paths are used, so
 * no `baseUrl` is set.
 */
const client = createHttpClient({}, {}, {});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Unwrap the `{ data: WatchlistItem[] }` envelope our routes return. */
function extractItems(payload: unknown): WatchlistItem[] {
  if (!(isRecord(payload) && Array.isArray(payload.data))) {
    throw new Error("Invalid watchlist response shape");
  }
  return payload.data as WatchlistItem[];
}

/** `GET /api/v1/profile/watchlist` — the visitor's server-side saved vehicles. */
export async function fetchWatchlistClient(signal?: AbortSignal): Promise<WatchlistItem[]> {
  return extractItems(await client.get(API_ROUTES.WATCHLIST, { signal }));
}

/** `POST /api/v1/profile/watchlist` — add a vehicle; returns the full updated list. */
export async function addToWatchlistClient(
  request: AddToWatchlistRequest,
  signal?: AbortSignal
): Promise<WatchlistItem[]> {
  return extractItems(await client.post(API_ROUTES.WATCHLIST, request, { signal }));
}

/** `DELETE /api/v1/profile/watchlist/{vin}` — remove a vehicle (204 No Content). */
export async function removeFromWatchlistClient(vin: string, signal?: AbortSignal): Promise<void> {
  await client.delete(API_ROUTES.watchlistByVin(vin), { signal });
}
