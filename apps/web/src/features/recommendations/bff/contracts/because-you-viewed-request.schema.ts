import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

/** Validated client-facing request schema. */
export const becauseYouViewedRequestSchema = z.object({
  /** Vehicle VIN — the backend derives taxonomy filters from this to find similar vehicles. */
  vin: z.string().regex(VIN_PATTERN).optional(),
});

export type BecauseYouViewedRequest = z.infer<typeof becauseYouViewedRequestSchema>;

/** Loose upstream request schema. */
export const becauseYouViewedUpstreamRequestSchema = z.object({
  vin: z.string().optional(),
});

export type BecauseYouViewedUpstreamRequest = z.infer<typeof becauseYouViewedUpstreamRequestSchema>;
