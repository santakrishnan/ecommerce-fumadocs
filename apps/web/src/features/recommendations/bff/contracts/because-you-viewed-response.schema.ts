import { inventorySchema, inventoryUpstreamSchema } from "@features/vehicle-detail/bff";
import { z } from "zod";

const paginationSchema = z.object({
  nextCursor: z.string().optional(),
  hasNext: z.boolean().optional(),
});

/** Validated client-facing response schema. */
export const becauseYouViewedResponseSchema = z.object({
  results: z.array(inventorySchema),
  pagination: paginationSchema.optional(),
});

export type BecauseYouViewedResponse = z.infer<typeof becauseYouViewedResponseSchema>;

/** Loose upstream response schema. */
export const becauseYouViewedUpstreamResponseSchema = z.object({
  results: z.array(inventoryUpstreamSchema),
  pagination: paginationSchema.optional(),
});

export type BecauseYouViewedUpstreamResponse = z.infer<
  typeof becauseYouViewedUpstreamResponseSchema
>;
