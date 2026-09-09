import "server-only";

import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { TradeInOfferResponse } from "../contracts/trade-in-offer-response.schema";
import type { TradeInRequest } from "../contracts/trade-in-request.schema";
import { createOriginationError, type OriginationError } from "../errors/origination.errors";
import type { Result } from "../lib/result";
import { mockGetTradeInOffer } from "../services/get-trade-in-offer-mock";
import { getTradeInOfferUpstream } from "../services/get-trade-in-offer-upstream";

export type GetTradeInOfferResult = Result<TradeInOfferResponse, OriginationError>;

/**
 * Use case: fetch a trade-in valuation offer for a vehicle (server-only).
 *
 * Identified by VIN or plate+state, resolves to a single offer that the
 * trade-in offer page (ORG-11) renders. The response carries no visitor PII —
 * only the vehicle and its valuation — so callers may cache it at the page
 * layer with `cacheLife("detail")`.
 *
 * Mock/upstream switch (mirrors `patchOrigination`):
 *
 * - `USE_ORIGINATION_MOCKS=true`                                              → fixture data (always wins)
 * - `API_UPSTREAM_URL` + `ORIGINATION_TRADEIN_API_KEY` via resolveBedService  → calls the trade-in provider
 * - Service not resolved                                                      → 503 (misconfiguration)
 */
export async function getTradeInOffer(
  request: TradeInRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<GetTradeInOfferResult> {
  if (process.env.USE_ORIGINATION_MOCKS === "true") {
    return mockGetTradeInOffer(request);
  }

  const service = resolveBedService("origination-tradein");
  if (!service) {
    return {
      success: false,
      error: createOriginationError(
        "ServiceUnavailable",
        "Trade-in valuation service is not configured (API_UPSTREAM_URL + ORIGINATION_TRADEIN_API_KEY)",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  return getTradeInOfferUpstream(service, request, traceId, identity);
}
