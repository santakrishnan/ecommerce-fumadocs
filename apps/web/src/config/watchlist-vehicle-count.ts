import { z } from "zod";

/**
 * Watchlist vehicle count demo override — cookie contract + option metadata.
 *
 * Controls how many vehicles the watchlist mock returns, allowing testing of
 * the Compare CTA visibility (hidden below 3) and the compare page column
 * count. Requires NEXT_PUBLIC_MOCKS=true.
 */

export const WATCHLIST_VEHICLE_COUNT_COOKIE = "demo-watchlist-vehicle-count";

export const watchlistVehicleCountSchema = z.enum(["1", "2", "3"]);

export type WatchlistVehicleCount = z.infer<typeof watchlistVehicleCountSchema>;

export const DEFAULT_WATCHLIST_VEHICLE_COUNT: WatchlistVehicleCount = "3";

interface WatchlistVehicleCountOption {
  description: string;
  title: string;
  value: WatchlistVehicleCount;
}

export const WATCHLIST_VEHICLE_COUNT_OPTIONS: readonly WatchlistVehicleCountOption[] = [
  {
    value: "1",
    title: "1 vehicle",
    description: "Single saved vehicle. Compare CTA hidden.",
  },
  {
    value: "2",
    title: "2 vehicles",
    description: "Two saved vehicles. Compare CTA hidden.",
  },
  {
    value: "3",
    title: "3+ vehicles (default)",
    description: "Full fixture. Compare CTA visible; compare opens with 3 columns.",
  },
] as const;
