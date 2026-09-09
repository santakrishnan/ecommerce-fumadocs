import type { TradeInOfferResponse } from "../contracts/trade-in-offer-response.schema";

/**
 * Typed fixture for the trade-in valuation offer. `satisfies` keeps it aligned
 * with `tradeInOfferResponseSchema`. The mock service returns this shape,
 * overriding `offerId` and `expiresAt` at call time so each lookup reads fresh.
 */
export const TRADE_IN_OFFER_FIXTURE: TradeInOfferResponse = {
  offerId: "33333333-3333-4333-8333-333333333333",
  vehicle: {
    year: 2021,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE Premium",
  },
  estimatedValue: {
    amount: 24_500,
    currency: "USD",
  },
  expiresAt: "2026-02-01T00:00:00.000Z",
  status: "offer",
} satisfies TradeInOfferResponse;
