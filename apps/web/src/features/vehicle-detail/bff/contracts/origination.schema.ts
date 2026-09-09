import { z } from "zod";

/**
 * Origination / payment state schema.
 * Discriminated union on `kind` — matches the domain types in `types.ts`.
 */
export const originationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("estimate"),
    estimatedMonthly: z.number(),
    downPayment: z.number(),
  }),
  z.object({
    kind: z.literal("offer"),
    monthly: z.number(),
    apr: z.number(),
    termMonths: z.number(),
    expiresAt: z.string().datetime(),
  }),
  z.object({ kind: z.literal("expired") }),
]);

export type OriginationResponse = z.infer<typeof originationSchema>;
