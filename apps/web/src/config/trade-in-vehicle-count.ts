import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import { z } from "zod";

/**
 * Trade-in vehicle count demo override — cookie contract + option metadata.
 *
 * Controls how many vehicles the mock service returns, allowing
 * testing of the "Add a vehicle" (1) vs "View all" (2+) UI branches.
 */

/** One year, in seconds. */
const TRADE_IN_VEHICLE_COUNT_COOKIE_TTL = 60 * 60 * 24 * 365;

/** `buildCookieConfig` (client-safe) applies the prod `__Host-` prefix. */
export const tradeInVehicleCountCookie = buildCookieConfig(
  "demo-trade-in-vehicle-count",
  TRADE_IN_VEHICLE_COUNT_COOKIE_TTL,
  { httpOnly: true, sameSite: "lax" }
);

export const TRADE_IN_VEHICLE_COUNT_COOKIE = tradeInVehicleCountCookie.name;

export const tradeInVehicleCountSchema = z.enum(["0", "1", "2", "3"]);

export type TradeInVehicleCount = z.infer<typeof tradeInVehicleCountSchema>;

export const DEFAULT_TRADE_IN_VEHICLE_COUNT: TradeInVehicleCount = "3";

interface TradeInVehicleCountOption {
  description: string;
  title: string;
  value: TradeInVehicleCount;
}

export const TRADE_IN_VEHICLE_COUNT_OPTIONS: readonly TradeInVehicleCountOption[] = [
  {
    value: "0",
    title: "No vehicles (invitation)",
    description: "Shows the trade-in invitation card below watchlist.",
  },
  {
    value: "1",
    title: "1 vehicle (Add a vehicle CTA)",
    description: "Shows a single vehicle card with 'Add a vehicle' link above watchlist.",
  },
  {
    value: "2",
    title: "2 vehicles (View all modal)",
    description: "Shows first vehicle card with 'View all' button that opens the modal.",
  },
  {
    value: "3",
    title: "3+ vehicles (View all modal)",
    description: "Full fixture baseline — selected for any total of 3 or more vehicles.",
  },
] as const;

/**
 * Resolve a possibly absent or invalid baseline count cookie value to a
 * valid `TradeInVehicleCount`, falling back to the existing default.
 */
export function resolveTradeInVehicleCount(raw?: string): TradeInVehicleCount {
  const parsed = tradeInVehicleCountSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_TRADE_IN_VEHICLE_COUNT;
}

/**
 * Map a combined vehicle total (fixture baseline plus manual additions) to
 * the fixed `TradeInVehicleCount` selector value. Any total of three or
 * more maps to `"3"`, which is visibly presented as `3+ vehicles`.
 */
export function deriveTradeInVehicleCountFromTotal(total: number): TradeInVehicleCount {
  if (total <= 0) {
    return "0";
  }
  if (total === 1) {
    return "1";
  }
  if (total === 2) {
    return "2";
  }
  return "3";
}
