import "server-only";

import { TRADE_IN_OFFER_FIXTURE } from "../__fixtures__/get-trade-in-offer.fixture";
import type { TradeInOfferResponse } from "../contracts/trade-in-offer-response.schema";
import type { TradeInRequest } from "../contracts/trade-in-request.schema";
import type { OriginationError } from "../errors/origination.errors";
import { mockDelay } from "../lib/mock-delay";
import type { Result } from "../lib/result";

/** Simulated latency for the third-party valuation call (external pricing engine). */
const MOCK_DELAY_MS = 60;

/** Offers are short-lived; the mock hands back one that expires 7 days out. */
const OFFER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Mock service for the trade-in valuation offer, returned when
 * `USE_ORIGINATION_MOCKS=true`.
 *
 * Returns the fixture offer with a fresh `offerId` and `expiresAt` so repeated
 * lookups read as distinct, time-bound offers. Stateless: the request (VIN vs
 * plate+state) identifies the vehicle upstream but does not drive the mock's
 * derived valuation. When the OpenAPI spec lands, only the upstream service
 * changes; this mock and the use-case signature stay put.
 */
export async function mockGetTradeInOffer(
  _request: TradeInRequest
): Promise<Result<TradeInOfferResponse, OriginationError>> {
  await mockDelay(MOCK_DELAY_MS);

  return {
    success: true,
    data: {
      ...TRADE_IN_OFFER_FIXTURE,
      offerId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + OFFER_TTL_MS).toISOString(),
    },
  };
}
