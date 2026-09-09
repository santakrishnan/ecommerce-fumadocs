import "server-only";

import type { ResolvedBedService } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import {
  type TradeInOfferResponse,
  tradeInOfferResponseSchema,
} from "../contracts/trade-in-offer-response.schema";
import type { TradeInRequest } from "../contracts/trade-in-request.schema";
import {
  createOriginationError,
  mapCaughtToOriginationError,
  type OriginationError,
} from "../errors/origination.errors";
import type { Result } from "../lib/result";

/** Path appended to the resolved `origination-tradein` BED base URL. */
const TRADE_IN_OFFER_ENDPOINT = "/valuations";

/**
 * Requests a trade-in valuation from the third-party `origination-tradein`
 * provider (VIN or plate+state → offer).
 *
 * The ONLY file that changes when the OpenAPI spec lands — the endpoint path
 * and the `safeParse` shape. The use-case signature, contracts, and fixtures
 * stay put.
 */
export async function getTradeInOfferUpstream(
  service: ResolvedBedService,
  request: TradeInRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<Result<TradeInOfferResponse, OriginationError>> {
  const client = createBedClient(service, identity);

  try {
    const response = await client.post(TRADE_IN_OFFER_ENDPOINT, request, {
      headers: { "X-Trace-Id": traceId },
    });

    const parsed = tradeInOfferResponseSchema.safeParse(response);
    if (!parsed.success) {
      return {
        success: false,
        error: createOriginationError(
          "UpstreamError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    return { success: false, error: mapCaughtToOriginationError(error) };
  }
}
