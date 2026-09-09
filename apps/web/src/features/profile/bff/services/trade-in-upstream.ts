import "server-only";

import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { TradeInVehiclesResponse } from "../contracts/trade-in-response";
import { createProfileError, type ProfileError } from "../errors/profile.errors";

type FetchTradeInVehiclesResult =
  | { success: true; data: TradeInVehiclesResponse }
  | { success: false; error: ProfileError };

/**
 * Upstream stub — not yet implemented.
 *
 * Returns a 503 until the real trade-in service is available and integrated.
 */
export async function fetchTradeInVehicles(_baseUrl: string): Promise<FetchTradeInVehiclesResult> {
  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "Trade-in upstream service is not yet implemented",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
