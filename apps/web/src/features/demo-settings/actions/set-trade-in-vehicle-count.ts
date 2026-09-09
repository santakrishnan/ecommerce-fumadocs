"use server";

import {
  TRADE_IN_VEHICLE_COUNT_COOKIE,
  tradeInVehicleCountCookie,
  tradeInVehicleCountSchema,
} from "@config/trade-in-vehicle-count";
import { TRADE_IN_VEHICLE_DATA_COOKIE } from "@features/profile/lib/trade-in-cookies";
import { cookies } from "next/headers";

export interface SetTradeInVehicleCountResult {
  success: boolean;
}

/**
 * Persist the selected trade-in vehicle count in the `demo-trade-in-vehicle-count` cookie.
 */
export async function setTradeInVehicleCount(value: string): Promise<SetTradeInVehicleCountResult> {
  const parsed = tradeInVehicleCountSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(TRADE_IN_VEHICLE_COUNT_COOKIE, parsed.data, {
    httpOnly: tradeInVehicleCountCookie.httpOnly,
    secure: tradeInVehicleCountCookie.secure,
    sameSite: tradeInVehicleCountCookie.sameSite,
    path: tradeInVehicleCountCookie.path,
    maxAge: tradeInVehicleCountCookie.maxAge,
  });
  cookieStore.delete(TRADE_IN_VEHICLE_DATA_COOKIE);

  return { success: true };
}

/**
 * Clear the cookie so the vehicle count falls back to the full fixture.
 */
export async function resetTradeInVehicleCount(): Promise<SetTradeInVehicleCountResult> {
  const cookieStore = await cookies();
  cookieStore.delete(TRADE_IN_VEHICLE_COUNT_COOKIE);
  cookieStore.delete(TRADE_IN_VEHICLE_DATA_COOKIE);
  return { success: true };
}
