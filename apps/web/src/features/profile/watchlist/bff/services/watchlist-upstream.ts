import "server-only";

import { type ResolvedBedService, WATCHLIST_ENDPOINTS } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { AddToWatchlistRequest, WatchlistItem } from "../contracts/watchlist-item.schema";
import {
  createWatchlistError,
  mapCaughtToWatchlistError,
  type WatchlistError,
} from "../errors/watchlist.errors";

// ─── Result types ────────────────────────────────────────────────────────────

type WatchlistResult =
  | { success: true; data: WatchlistItem[] }
  | { success: false; error: WatchlistError };

type RemoveResult = { success: true } | { success: false; error: WatchlistError };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Extracts `WatchlistItem[]` from the upstream envelope `{ data: [...] }`.
 * Returns null on unexpected shapes so the caller can produce a structured error.
 */
function parseWatchlistEnvelope(raw: unknown): WatchlistItem[] | null {
  if (!isRecord(raw)) {
    return null;
  }
  const data = raw.data;
  if (!Array.isArray(data)) {
    return null;
  }
  return data as WatchlistItem[];
}

const UNEXPECTED_SHAPE = createWatchlistError(
  "InternalError",
  "Upstream returned an unexpected response shape",
  HTTP_STATUS_BAD_GATEWAY
);

// ─── Upstream calls ──────────────────────────────────────────────────────────

/** `GET /watchlist` — list the visitor's saved vehicles. */
export async function fetchWatchlist(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): Promise<WatchlistResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.get(WATCHLIST_ENDPOINTS.base);
    const data = parseWatchlistEnvelope(raw);
    return data ? { success: true, data } : { success: false, error: UNEXPECTED_SHAPE };
  } catch (error) {
    return { success: false, error: mapCaughtToWatchlistError(error) };
  }
}

/** `POST /watchlist` — add a vehicle; returns the full updated list. */
export async function postWatchlistItem(
  service: ResolvedBedService,
  request: AddToWatchlistRequest,
  identity?: BedVisitorIdentity
): Promise<WatchlistResult> {
  const client = createBedClient(service, identity);
  // Debug logging removed to avoid leaking secrets / visitor identity to logs.
  try {
    const raw = await client.post(WATCHLIST_ENDPOINTS.base, request);
    const data = parseWatchlistEnvelope(raw);
    return data ? { success: true, data } : { success: false, error: UNEXPECTED_SHAPE };
  } catch (error) {
    // Avoid logging raw upstream error bodies / request details here; map and return a typed error.
    return { success: false, error: mapCaughtToWatchlistError(error) };
  }
}

/** `DELETE /watchlist/{vin}` — remove a vehicle (204 No Content). */
export async function deleteWatchlistItem(
  service: ResolvedBedService,
  vin: string,
  identity?: BedVisitorIdentity
): Promise<RemoveResult> {
  const client = createBedClient(service, identity);
  try {
    await client.delete(WATCHLIST_ENDPOINTS.byVin(vin));
    return { success: true };
  } catch (error) {
    return { success: false, error: mapCaughtToWatchlistError(error) };
  }
}
