import { z } from "zod";

/** Validated client-facing suggestion card schema. */
export const suggestionCardSchema = z.object({
  imageUrl: z.url(),
  imageAlt: z.string(),
  headline: z.string(),
  eyebrow: z.string(),
  ctaLink: z.url(),
  /** Number of matching results. When present, the card shows a "X Found Matches" button. */
  matches: z.number().int().nonnegative().optional(),
  /** Surface context for text color on image overlays. */
  surface: z.enum(["light", "dark"]).optional(),
});

export type SuggestionCard = z.infer<typeof suggestionCardSchema>;

/** Validated client-facing response schema. */
export const searchRecentResponseSchema = z.array(suggestionCardSchema);

export type SearchRecentResponse = z.infer<typeof searchRecentResponseSchema>;

/** Loose upstream suggestion card schema — no validation constraints. */
export const suggestionCardUpstreamSchema = z.object({
  imageUrl: z.string(),
  imageAlt: z.string(),
  headline: z.string(),
  eyebrow: z.string(),
  ctaLink: z.string(),
  matches: z.number().optional(),
  surface: z.enum(["light", "dark"]).optional(),
});

export type SuggestionCardUpstream = z.infer<typeof suggestionCardUpstreamSchema>;

/** Loose upstream response schema — no validation constraints. */
export const searchRecentUpstreamResponseSchema = z.array(suggestionCardUpstreamSchema);

export type SearchRecentUpstreamResponse = z.infer<typeof searchRecentUpstreamResponseSchema>;
