import { z } from "zod";

const MAX_QUERY_LENGTH = 4000;
const MIN_QUERY_LENGTH = 2;

/**
 * Client-facing request schema for GET /api/v1/search/autocomplete.
 * Validated at the BFF boundary before delegating to the use-case.
 */
export const autocompleteRequestSchema = z.object({
  q: z.string().min(MIN_QUERY_LENGTH).max(MAX_QUERY_LENGTH),
});

export type AutocompleteRequest = z.infer<typeof autocompleteRequestSchema>;
