import "server-only";

import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { TradeInVehicle } from "../contracts/trade-in-response";
import { createProfileError, type ProfileError } from "../errors/profile.errors";

type LookupTradeInVehicleResult =
  | { success: true; data: TradeInVehicle }
  | { success: false; error: ProfileError };

/**
 * Upstream stub — not yet implemented.
 *
 * Returns a 503 until the real trade-in valuation service is available.
 */
export async function fetchLookupTradeInVehicle(
  _baseUrl: string,
  _plate: string,
  _state: string
): Promise<LookupTradeInVehicleResult> {
  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "Trade-in lookup upstream service is not yet implemented",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
