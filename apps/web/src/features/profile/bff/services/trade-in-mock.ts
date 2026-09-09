import "server-only";

import {
  resolveTradeInVehicleCount,
  TRADE_IN_VEHICLE_COUNT_COOKIE,
} from "@config/trade-in-vehicle-count";
import { cookies } from "next/headers";
import { TRADE_IN_VEHICLES_FIXTURE } from "../__fixtures__/trade-in.fixture";
import type { TradeInVehiclesResponse } from "../contracts/trade-in-response";

const MOCK_DELAY_MS = 50;

/**
 * Returns fixture trade-in vehicles. The demo count cookie controls how many
 * are returned (0–3), resolved through the shared baseline helper so an
 * absent or invalid cookie falls back to the same default used by demo
 * settings.
 */
export async function mockGetTradeInVehicles(): Promise<TradeInVehiclesResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const cookieStore = await cookies();
  const countCookie = cookieStore.get(TRADE_IN_VEHICLE_COUNT_COOKIE)?.value;
  const resolvedCount = resolveTradeInVehicleCount(countCookie);

  return TRADE_IN_VEHICLES_FIXTURE.slice(0, Number(resolvedCount));
}
