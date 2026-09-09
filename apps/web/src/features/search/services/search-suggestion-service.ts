import type {
  AutocompleteService,
  Suggestion,
} from "@features/search/bff/contracts/autocomplete-response.schema";
import { SEARCH_SUGGESTION_TRIGGERS } from "../data/suggestion-triggers";

/** Flat pool of all suggestions from trigger data (IDs already unique in data). */
const ALL_SUGGESTIONS: Suggestion[] = SEARCH_SUGGESTION_TRIGGERS.flatMap(
  (trigger) => trigger.suggestions
);

/**
 * Search suggestion service.
 * Returns random suggestions from the mock data pool.
 *
 * When the real API endpoint is ready, replace the body with:
 *   return fetch(`/api/suggestions?q=${encodeURIComponent(query)}`).then(r => r.json())
 */
export const searchSuggestionService: AutocompleteService = {
  async getSuggestions(_query: string): Promise<Suggestion[]> {
    const shuffled = [...ALL_SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  },
};
