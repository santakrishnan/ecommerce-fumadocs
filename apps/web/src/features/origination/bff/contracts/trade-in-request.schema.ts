import { z } from "zod";

/**
 * Validated request for the trade-in valuation endpoint (BFF-04, folded into
 * the trade-in entry ticket).
 *
 * A vehicle is identified either by its 17-character VIN, or by a license plate
 * paired with a 2-letter US state code — never both. The union mirrors the two
 * lookup paths the trade-in provider supports.
 *
 * Both branches are cache-safe: VIN and plate+state are vehicle identifiers,
 * not visitor PII, so they may participate in a cache key (`cacheLife("detail")`
 * at the page layer).
 */
export const tradeInRequestSchema = z.union([
  z.object({ vin: z.string().length(17) }),
  z.object({ plate: z.string().min(1), state: z.string().length(2) }),
]);

export type TradeInRequest = z.infer<typeof tradeInRequestSchema>;
