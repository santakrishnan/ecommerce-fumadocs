import type { TradeInVehicle } from "@features/profile/bff/contracts/trade-in-response";
import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import { z } from "zod";

/** One year, in seconds. */
const TRADE_IN_VEHICLE_DATA_TTL = 60 * 60 * 24 * 365;

/** Mock-mode added-vehicle cookie; `buildCookieConfig` applies the prod `__Host-` prefix. */
export const tradeInVehicleDataCookie = buildCookieConfig(
  "trade-in-vehicle-data",
  TRADE_IN_VEHICLE_DATA_TTL,
  { httpOnly: true, sameSite: "lax" }
);

export const TRADE_IN_VEHICLE_DATA_COOKIE = tradeInVehicleDataCookie.name;

export const tradeInVehicleSchema: z.ZodType<TradeInVehicle> = z.object({
  estimatedValue: z.number(),
  id: z.string(),
  imageUrl: z.string(),
  licensePlate: z.string(),
  state: z.string(),
  title: z.string(),
  year: z.number(),
});

/** Validated ordered collection of manually added trade-in vehicles. */
export const tradeInVehiclesSchema = z.array(tradeInVehicleSchema);

/**
 * Parse the added-vehicle data cookie into an ordered, validated collection.
 *
 * Accepts the current array format and normalizes a valid legacy single
 * `TradeInVehicle` object (written before the collection format existed)
 * into a one-item array. Absent, malformed, or schema-invalid data safely
 * resolves to an empty array so profile rendering is never blocked.
 */
export function parseAddedVehicles(raw?: string): TradeInVehicle[] {
  if (raw === undefined) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const arrayResult = tradeInVehiclesSchema.safeParse(parsed);
  if (arrayResult.success) {
    return arrayResult.data;
  }

  const legacyResult = tradeInVehicleSchema.safeParse(parsed);
  return legacyResult.success ? [legacyResult.data] : [];
}
