import "server-only";

import { resolveBedService } from "@config/bed-services";
import { clientEnv } from "@config/client-env";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { AddToWatchlistRequest, WatchlistItem } from "../contracts/watchlist-item.schema";
import { createWatchlistError, type WatchlistError } from "../errors/watchlist.errors";
import {
  mockDeleteWatchlistItem,
  mockFetchWatchlist,
  mockPostWatchlistItem,
} from "../services/watchlist-mock";
import {
  deleteWatchlistItem,
  fetchWatchlist,
  postWatchlistItem,
} from "../services/watchlist-upstream";

// ─── Result types ────────────────────────────────────────────────────────────

export type GetWatchlistResult =
  | { success: true; data: WatchlistItem[] }
  | { success: false; error: WatchlistError };

export type AddToWatchlistResult =
  | { success: true; data: WatchlistItem[] }
  | { success: false; error: WatchlistError };

export type RemoveFromWatchlistResult =
  | { success: true }
  | { success: false; error: WatchlistError };

// ─── Shared setup ────────────────────────────────────────────────────────────

const NOT_CONFIGURED = createWatchlistError(
  "InternalError",
  "Visitors upstream service is not configured (API_UPSTREAM_URL + VISITORS_API_KEY)",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

// ─── Use cases ───────────────────────────────────────────────────────────────

/**
 * List the visitor's saved vehicles (server-authoritative).
 * The visitor identity is read from httpOnly cookies and forwarded as headers.
 */
export async function getWatchlist(): Promise<GetWatchlistResult> {
  if (clientEnv.NEXT_PUBLIC_MOCKS === "true") {
    const identity = await readVisitorIdentity();
    return mockFetchWatchlist(identity);
  }

  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }

  const identity = await readVisitorIdentity();
  return fetchWatchlist(visitors, identity);
}

/**
 * Add a vehicle to the visitor's watchlist.
 * The upstream returns the full updated list for client reconciliation.
 */
export async function addToWatchlist(
  request: AddToWatchlistRequest
): Promise<AddToWatchlistResult> {
  if (clientEnv.NEXT_PUBLIC_MOCKS === "true") {
    const identity = await readVisitorIdentity();
    return mockPostWatchlistItem(request, identity);
  }

  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }

  const identity = await readVisitorIdentity();
  return postWatchlistItem(visitors, request, identity);
}

/**
 * Remove a vehicle from the visitor's watchlist by VIN (204 upstream).
 */
export async function removeFromWatchlist(vin: string): Promise<RemoveFromWatchlistResult> {
  if (clientEnv.NEXT_PUBLIC_MOCKS === "true") {
    const identity = await readVisitorIdentity();
    return mockDeleteWatchlistItem(vin, identity);
  }

  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }

  const identity = await readVisitorIdentity();
  return deleteWatchlistItem(visitors, vin, identity);
}
