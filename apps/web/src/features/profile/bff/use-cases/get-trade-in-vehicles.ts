import "server-only";

import { env } from "@config/env";
import { TRADE_IN_VEHICLE_COUNT_COOKIE } from "@config/trade-in-vehicle-count";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import { cookies } from "next/headers";
import { parseAddedVehicles, TRADE_IN_VEHICLE_DATA_COOKIE } from "../../lib/trade-in-cookies";
import type { TradeInVehiclesResponse } from "../contracts/trade-in-response";
import { createProfileError, type ProfileError } from "../errors/profile.errors";
import { mockGetTradeInVehicles } from "../services/trade-in-mock";
import { fetchTradeInVehicles } from "../services/trade-in-upstream";

export type GetTradeInVehiclesResult =
  | { success: true; data: TradeInVehiclesResponse }
  | { success: false; error: ProfileError };

/**
 * Give a vehicle a stable, distinct list-rendering identity. Every fresh
 * write already assigns a UUID, but a legacy single-object cookie or a
 * fixture-baseline collision can still produce a duplicate id. `usedIds` is
 * mutated so a run of several added vehicles cannot collide with each other
 * either.
 */
function makeVehicleIdUnique(
  vehicle: TradeInVehiclesResponse[number],
  usedIds: Set<string>
): TradeInVehiclesResponse[number] {
  if (!usedIds.has(vehicle.id)) {
    usedIds.add(vehicle.id);
    return vehicle;
  }

  let uniqueId = `${vehicle.id}-added`;
  let suffix = 2;

  while (usedIds.has(uniqueId)) {
    uniqueId = `${vehicle.id}-added-${suffix}`;
    suffix += 1;
  }

  usedIds.add(uniqueId);
  return { ...vehicle, id: uniqueId };
}

/**
 * Use case: fetch trade-in vehicles for the current visitor.
 *
 * TODO: When real API is available, remove all mock/cookie logic below.
 * The only path should be: call upstream → return result.
 *
 * Current mock priority:
 * 1. Demo count cookie or either trade-in mock flag → use the count-aware mock baseline
 *    and append every persisted manually added vehicle, in order, when present
 * 2. Persisted manually added vehicles without mocks → return that collection only
 * 3. API_UPSTREAM_URL → call real upstream
 * 4. Otherwise → fail with 503
 */
export async function getTradeInVehicles(): Promise<GetTradeInVehiclesResult> {
  const cookieStore = await cookies();

  const demoCountCookie = cookieStore.get(TRADE_IN_VEHICLE_COUNT_COOKIE)?.value;
  const rawVehicles = cookieStore.get(TRADE_IN_VEHICLE_DATA_COOKIE)?.value;
  const addedVehicles = parseAddedVehicles(rawVehicles);
  const mockMode =
    demoCountCookie !== undefined ||
    process.env.USE_TRADE_IN_MOCKS === "true" ||
    process.env.USE_TRADE_IN_LOOKUP_MOCKS === "true";

  if (mockMode) {
    const baselineSlice = await mockGetTradeInVehicles();
    const usedIds = new Set(baselineSlice.map((vehicle) => vehicle.id));
    const uniqueAddedVehicles = addedVehicles.map((vehicle) =>
      makeVehicleIdUnique(vehicle, usedIds)
    );
    return { success: true, data: [...baselineSlice, ...uniqueAddedVehicles] };
  }

  if (addedVehicles.length > 0) {
    return { success: true, data: addedVehicles };
  }

  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (upstreamUrl) {
    return fetchTradeInVehicles(upstreamUrl);
  }

  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "API_UPSTREAM_URL is not configured and USE_TRADE_IN_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
