import { z } from "zod";

/** Validated client-facing request schema. */
export const profileSuggestionsRequestSchema = z.object({});

export type ProfileSuggestionsRequest = z.infer<typeof profileSuggestionsRequestSchema>;

/** Loose upstream request schema. */
export const profileSuggestionsUpstreamRequestSchema = z.object({});

export type ProfileSuggestionsUpstreamRequest = z.infer<
  typeof profileSuggestionsUpstreamRequestSchema
>;
