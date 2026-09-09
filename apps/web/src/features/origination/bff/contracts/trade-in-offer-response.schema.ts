import { z } from "zod";

/**
 * The trade-in valuation offer returned by the third-party `origination-tradein`
 * provider (VIN or plate+state → offer). Rendered on the trade-in offer page
 * (ORG-11); this ticket owns the contract + mocked endpoint that precedes it.
 *
 * `status` distinguishes a real offer from the two non-offer outcomes:
 * - `offer`       — a valuation is available (`estimatedValue` is meaningful)
 * - `needs_info`  — the provider needs more input before it can price
 * - `ineligible`  — the vehicle cannot be traded in
 */
export const tradeInOfferResponseSchema = z.object({
  offerId: z.uuid(),
  vehicle: z.object({
    year: z.number(),
    make: z.string(),
    model: z.string(),
    trim: z.string().optional(),
  }),
  estimatedValue: z.object({
    amount: z.number().int(),
    currency: z.literal("USD"),
  }),
  expiresAt: z.string(),
  status: z.enum(["offer", "needs_info", "ineligible"]),
});

export type TradeInOfferResponse = z.infer<typeof tradeInOfferResponseSchema>;
