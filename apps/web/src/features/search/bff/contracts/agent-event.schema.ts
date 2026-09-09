import { z } from "zod";

// ---------------------------------------------------------------------------
// Search suggestions schemas
// ---------------------------------------------------------------------------

export const searchSuggestionsSectionSchema = z.object({
  ariaLabel: z.string().min(1).optional(),
  headline: z.string().min(1).optional(),
});

export const searchSuggestionImageSchema = z.object({
  alt: z.string(),
  src: z.string(),
});

export const searchSuggestionActionTypeSchema = z.enum(["seed-search"]);

export const searchSuggestionActionSchema = z.object({
  id: z.string().min(1),
  type: searchSuggestionActionTypeSchema,
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
});

export const searchSuggestionMetadataSchema = z
  .object({
    category: z.string().min(1).optional(),
    locationLabel: z.string().min(1).optional(),
  })
  .optional();

// --- Client-facing suggestion card schema ---

export const searchSuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  image: searchSuggestionImageSchema.optional(),
  action: searchSuggestionActionSchema,
  metadata: searchSuggestionMetadataSchema,
});

export const searchSuggestionsResponseSchema = z.object({
  section: searchSuggestionsSectionSchema.optional(),
  suggestions: z.array(searchSuggestionSchema),
});

export const searchSuggestionsRequestSchema = z.object({});

/** Loose upstream request schema. */
export const searchSuggestionsUpstreamRequestSchema = searchSuggestionsRequestSchema;

/** Permissive upstream response schema — upstream field quality does not leak to frontend. */
export const searchSuggestionsUpstreamResponseSchema = z.object({
  section: z
    .object({
      ariaLabel: z.string().optional(),
      headline: z.string().optional(),
    })
    .optional(),
  suggestions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      image: z
        .object({
          alt: z.string(),
          src: z.string(),
        })
        .optional(),
      action: z.object({
        id: z.string(),
        type: z.string(),
        label: z.string().optional(),
        value: z.string().optional(),
        href: z.string().optional(),
      }),
      metadata: z
        .object({
          category: z.string().optional(),
          locationLabel: z.string().optional(),
        })
        .optional(),
    })
  ),
});

// ---------------------------------------------------------------------------
// SDK type re-exports for agent SSE events.
// ---------------------------------------------------------------------------
export type {
  AgentSearchEvent,
  AgentSearchResult,
  CompleteEvent as AgentSearchCompleteEvent,
  StreamErrorEvent as AgentSearchErrorEvent,
} from "@ucmp/sdk-search-api";
export type SearchSuggestionsRequest = z.infer<typeof searchSuggestionsRequestSchema>;
export type SearchSuggestionsUpstreamRequest = z.infer<
  typeof searchSuggestionsUpstreamRequestSchema
>;
export type SearchSuggestionsResponse = z.infer<typeof searchSuggestionsResponseSchema>;
export type SearchSuggestionsUpstreamResponse = z.infer<
  typeof searchSuggestionsUpstreamResponseSchema
>;
export type SearchSuggestionsSection = z.infer<typeof searchSuggestionsSectionSchema>;
export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;
export type SearchSuggestionImage = z.infer<typeof searchSuggestionImageSchema>;
export type SearchSuggestionAction = z.infer<typeof searchSuggestionActionSchema>;
export type SearchSuggestionActionType = z.infer<typeof searchSuggestionActionTypeSchema>;
export type SearchSuggestionMetadata = z.infer<typeof searchSuggestionMetadataSchema>;
