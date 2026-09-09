import { z } from "zod";

const suggestionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

/**
 * Client-facing response schema for GET /api/v1/search/autocomplete.
 */
export const autocompleteResponseSchema = z.object({
  suggestions: z.array(suggestionSchema),
  meta: z.object({
    traceId: z.string(),
    timestamp: z.string(),
  }),
});

export type AutocompleteResponse = z.infer<typeof autocompleteResponseSchema>;
export type AutocompleteSuggestion = z.infer<typeof suggestionSchema>;

/**
 * Convenience alias — matches the name used by client components.
 * Prefer `AutocompleteSuggestion` in new code.
 */
export type Suggestion = AutocompleteSuggestion;

/**
 * Contract for any autocomplete provider.
 * Components accept this as a prop — never hardcode a specific implementation.
 */
export interface AutocompleteService {
  getSuggestions(query: string): Promise<Suggestion[]>;
}
