import "server-only";

import {
  DEFAULT_WATCHLIST_VEHICLE_COUNT,
  WATCHLIST_VEHICLE_COUNT_COOKIE,
  watchlistVehicleCountSchema,
} from "@config/watchlist-vehicle-count";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_NOT_FOUND } from "@shared/lib/http/status-codes";
import { cookies } from "next/headers";
import { WATCHLIST_ITEMS_FIXTURE } from "../../__fixtures__/watchlist-items.fixture";
import type { AddToWatchlistRequest, WatchlistItem } from "../contracts/watchlist-item.schema";
import { createWatchlistError, type WatchlistError } from "../errors/watchlist.errors";

const MOCK_DELAY_MS = 50;
const DEFAULT_VISITOR_ID = "dd07a7b4-e73c-470a-a028-4174307c7794";

type WatchlistResult =
  | { success: true; data: WatchlistItem[] }
  | { success: false; error: WatchlistError };

type RemoveResult = { success: true } | { success: false; error: WatchlistError };

const watchlistByVisitorId = new Map<string, WatchlistItem[]>();

function cloneWatchlist(items: WatchlistItem[]): WatchlistItem[] {
  return items.map((item) => ({ ...item }));
}

function resolveVisitorId(identity?: BedVisitorIdentity): string {
  return identity?.visitorId || DEFAULT_VISITOR_ID;
}

function sortByLastActive(items: WatchlistItem[]): WatchlistItem[] {
  return [...items].sort((a, b) => Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt));
}

function seedVisitorWatchlist(visitorId: string): WatchlistItem[] {
  if (watchlistByVisitorId.has(visitorId)) {
    return watchlistByVisitorId.get(visitorId) ?? [];
  }

  const seeded = cloneWatchlist(WATCHLIST_ITEMS_FIXTURE);

  watchlistByVisitorId.set(visitorId, seeded);
  return seeded;
}

async function mockDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
}

async function applyDemoVehicleCount(items: WatchlistItem[]): Promise<WatchlistItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WATCHLIST_VEHICLE_COUNT_COOKIE)?.value;
  const parsed = watchlistVehicleCountSchema.safeParse(raw);
  const count = parsed.success ? parsed.data : DEFAULT_WATCHLIST_VEHICLE_COUNT;

  if (count === DEFAULT_WATCHLIST_VEHICLE_COUNT) {
    return items;
  }

  return items.slice(0, Number(count));
}

export async function mockFetchWatchlist(identity?: BedVisitorIdentity): Promise<WatchlistResult> {
  await mockDelay();

  const visitorId = resolveVisitorId(identity);
  const records = seedVisitorWatchlist(visitorId);
  const data = await applyDemoVehicleCount(sortByLastActive(records));
  return { success: true, data };
}

export async function mockPostWatchlistItem(
  request: AddToWatchlistRequest,
  identity?: BedVisitorIdentity
): Promise<WatchlistResult> {
  await mockDelay();

  const visitorId = resolveVisitorId(identity);
  const records = seedVisitorWatchlist(visitorId);
  const vin = request.vin.trim().toUpperCase();
  const now = new Date().toISOString();
  const existingIndex = records.findIndex((item) => item.vin === vin);

  if (existingIndex >= 0) {
    const existing = records[existingIndex];
    if (!existing) {
      return { success: true, data: sortByLastActive(records) };
    }
    records[existingIndex] = {
      ...existing,
      lastActiveAt: now,
      price: request.price,
      title: request.title,
      updatedAt: now,
      vehicleId: request.vehicleId,
      vin,
    };

    return { success: true, data: sortByLastActive(records) };
  }

  records.unshift({
    createdAt: now,
    lastActiveAt: now,
    price: request.price,
    title: request.title,
    updatedAt: now,
    vehicleId: request.vehicleId,
    vin,
  });

  return { success: true, data: sortByLastActive(records) };
}

export async function mockDeleteWatchlistItem(
  vin: string,
  identity?: BedVisitorIdentity
): Promise<RemoveResult> {
  await mockDelay();

  const visitorId = resolveVisitorId(identity);
  const records = seedVisitorWatchlist(visitorId);
  const normalizedVin = vin.trim().toUpperCase();
  const beforeCount = records.length;
  const filtered = records.filter((item) => item.vin !== normalizedVin);

  if (filtered.length === beforeCount) {
    return {
      success: false,
      error: createWatchlistError(
        "WATCHLIST_NOT_FOUND",
        "Vehicle not found in watchlist",
        HTTP_STATUS_NOT_FOUND
      ),
    };
  }

  watchlistByVisitorId.set(visitorId, filtered);
  return { success: true };
}
