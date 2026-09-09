"use server";

import {
  WATCHLIST_VEHICLE_COUNT_COOKIE,
  watchlistVehicleCountSchema,
} from "@config/watchlist-vehicle-count";
import { cookies } from "next/headers";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface SetWatchlistVehicleCountResult {
  success: boolean;
}

/**
 * Persist the selected watchlist vehicle count in the
 * `demo-watchlist-vehicle-count` cookie.
 */
export async function setWatchlistVehicleCount(
  value: string
): Promise<SetWatchlistVehicleCountResult> {
  const parsed = watchlistVehicleCountSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(WATCHLIST_VEHICLE_COUNT_COOKIE, parsed.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { success: true };
}

/**
 * Clear the cookie so the watchlist falls back to the full fixture (3+).
 */
export async function resetWatchlistVehicleCount(): Promise<SetWatchlistVehicleCountResult> {
  const cookieStore = await cookies();
  cookieStore.delete(WATCHLIST_VEHICLE_COUNT_COOKIE);
  return { success: true };
}
