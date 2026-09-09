/**
 * Resolves the canonical display price from a vehicle pricing object.
 *
 * Single source of truth for price precedence across all mappers:
 *
 *   effectivePrice/finalPrice → sellingPrice → listPrice → msrp → 0
 *
 * `effectivePrice` (BFF response) and `finalPrice` (agent stream) are the
 * backend-computed canonical price accounting for dealer rules, promotions,
 * and regional adjustments. When present, it always wins.
 *
 * Uses `||` (not `??`) so that `0` from the API is treated as "not set" and
 * falls through to the next field. The backend sends `0` when a price tier
 * is not applicable rather than `null`.
 *
 * @example
 * ```ts
 * // BFF search response (has computed.effectivePrice)
 * resolveDisplayPrice({ effectivePrice: 38_500, sellingPrice: 0, listPrice: 42_000 })
 * // → 38_500
 *
 * // Agent stream (has finalPrice)
 * resolveDisplayPrice({ finalPrice: 35_200, sellingPrice: 35_200, listPrice: 0 })
 * // → 35_200
 *
 * // Missing effective — falls through
 * resolveDisplayPrice({ sellingPrice: 40_000, listPrice: 42_000, msrp: 44_000 })
 * // → 40_000
 *
 * // All zero — returns 0
 * resolveDisplayPrice({ sellingPrice: 0, listPrice: 0, msrp: 0 })
 * // → 0
 * ```
 */
export interface DisplayPricingInput {
  /** Backend-computed canonical price (BFF search responses). */
  effectivePrice?: number | null;
  /** Backend-computed canonical price (agent SSE stream). */
  finalPrice?: number | null;
  /** Dealer list price (sticker). */
  listPrice?: number | null;
  /** Manufacturer's suggested retail price. */
  msrp?: number | null;
  /** Current selling/asking price. */
  sellingPrice?: number | null;
}

export function resolveDisplayPrice(pricing: DisplayPricingInput): number {
  return (
    pricing.effectivePrice ||
    pricing.finalPrice ||
    pricing.sellingPrice ||
    pricing.listPrice ||
    pricing.msrp ||
    0
  );
}
