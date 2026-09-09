"use server";

import { cookies } from "next/headers";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import {
  parseAddedVehicles,
  TRADE_IN_VEHICLE_DATA_COOKIE,
  tradeInVehicleDataCookie,
  tradeInVehicleSchema,
} from "../lib/trade-in-cookies";

export interface AddTradeInVehicleResult {
  success: boolean;
}

/**
 * Conservative serialized-payload budget for the added-vehicle collection
 * cookie. This is a technical safeguard against browser cookie capacity
 * limits, not a product-facing vehicle-count cap.
 */
const ADDED_VEHICLES_COOKIE_BYTE_BUDGET = 3800;

/**
 * Server Action: append a trade-in vehicle to the user's profile.
 *
 * Mock implementation — persists an ordered vehicle collection JSON in a
 * cookie so getTradeInVehicles can return every vehicle the user submitted,
 * including repeated additions of the same VIN, plate, or lookup result.
 *
 * The real upstream call will be wired when the backend is available.
 */
export async function addTradeInVehicleAction(
  vehicle: TradeInVehicle
): Promise<AddTradeInVehicleResult> {
  // TODO: Replace entire body with real upstream persistence call.
  // Remove TRADE_IN_VEHICLE_DATA_COOKIE and the cookie logic below — they
  // exist only for mock mode.
  const parsedVehicle = tradeInVehicleSchema.safeParse(vehicle);

  if (!parsedVehicle.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  const existingVehicles = parseAddedVehicles(cookieStore.get(TRADE_IN_VEHICLE_DATA_COOKIE)?.value);
  const storedVehicle = { ...parsedVehicle.data, id: crypto.randomUUID() };
  const nextVehicles = [...existingVehicles, storedVehicle];
  const serialized = JSON.stringify(nextVehicles);

  if (new TextEncoder().encode(serialized).length > ADDED_VEHICLES_COOKIE_BYTE_BUDGET) {
    return { success: false };
  }

  // Persist the complete collection, preserving every prior addition.
  cookieStore.set(TRADE_IN_VEHICLE_DATA_COOKIE, serialized, {
    httpOnly: tradeInVehicleDataCookie.httpOnly,
    secure: tradeInVehicleDataCookie.secure,
    sameSite: tradeInVehicleDataCookie.sameSite,
    path: tradeInVehicleDataCookie.path,
    maxAge: tradeInVehicleDataCookie.maxAge,
  });

  return { success: true };
}
