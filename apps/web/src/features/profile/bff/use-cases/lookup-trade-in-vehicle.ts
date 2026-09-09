import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { TradeInVehicle } from "../contracts/trade-in-response";
import { createProfileError, type ProfileError } from "../errors/profile.errors";
import { mockLookupTradeInVehicle } from "../services/trade-in-lookup-mock";
import { fetchLookupTradeInVehicle } from "../services/trade-in-lookup-upstream";

export type LookupTradeInVehicleResult =
  | { success: true; data: TradeInVehicle }
  | { success: false; error: ProfileError };

/**
 * Use case: look up a vehicle's estimated trade-in value by plate + state.
 *
 * - When USE_TRADE_IN_LOOKUP_MOCKS is "true" → returns mock data with 2s delay
 * - When API_UPSTREAM_URL is set → calls the real upstream (stub for now)
 * - Otherwise → fails fast with 503
 */
export async function lookupTradeInVehicle(
  plate: string,
  state: string
): Promise<LookupTradeInVehicleResult> {
  if (env.USE_TRADE_IN_LOOKUP_MOCKS === "true") {
    const data = await mockLookupTradeInVehicle(plate, state);
    if (data) {
      return { success: true, data };
    }
    return {
      success: false,
      error: createProfileError("PROFILE_UPSTREAM_ERROR", "Mock lookup returned no vehicle", 404),
    };
  }

  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  if (upstreamUrl) {
    return fetchLookupTradeInVehicle(upstreamUrl, plate, state);
  }

  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "API_UPSTREAM_URL is not configured and USE_TRADE_IN_LOOKUP_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
