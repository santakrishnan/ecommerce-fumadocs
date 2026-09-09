import { z } from "zod";

/** Validated client-facing suggestion card schema. */
export const suggestionCardSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  href: z.string(),
  iconName: z.string().optional(),
  imageUrl: z.string(),
  /** Number of matching results. When present, the card shows a "X Found Matches" button. */
  matches: z.number().int().nonnegative().optional(),
  /** Surface context for text color. */
  surface: z.enum(["light", "dark"]).optional(),
});

export type SuggestionCard = z.infer<typeof suggestionCardSchema>;

/** Validated client-facing response schema. */
export const profileSuggestionsResponseSchema = z.array(suggestionCardSchema);

export type ProfileSuggestionsResponse = z.infer<typeof profileSuggestionsResponseSchema>;

/** Loose upstream suggestion card schema — no validation constraints. */
export const suggestionCardUpstreamSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  href: z.string(),
  iconName: z.string().optional(),
  imageUrl: z.string(),
  matches: z.number().optional(),
  surface: z.enum(["light", "dark"]).optional(),
});

export type SuggestionCardUpstream = z.infer<typeof suggestionCardUpstreamSchema>;

/** Loose upstream response schema — no validation constraints. */
export const profileSuggestionsUpstreamResponseSchema = z.array(suggestionCardUpstreamSchema);

export type ProfileSuggestionsUpstreamResponse = z.infer<
  typeof profileSuggestionsUpstreamResponseSchema
>;
