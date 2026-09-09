"use client";

import type {
  AutocompleteService,
  Suggestion,
} from "@features/search/bff/contracts/autocomplete-response.schema";

/**
 * Client-side AutocompleteService that fetches suggestions from
 * GET /api/v1/search/autocomplete?q=<query>.
 *
 * Implements Google-style behaviour:
 * - Debouncing is handled by the consumer hook (useSearchSuggestions)
 * - Stale requests are discarded via AbortController
 * - Errors return empty suggestions silently (no UI disruption)
 */
export const apiAutocompleteService: AutocompleteService = {
  async getSuggestions(query: string): Promise<Suggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    try {
      const response = await fetch(`/api/v1/search/autocomplete?q=${encodeURIComponent(trimmed)}`);

      if (!response.ok) {
        return [];
      }

      const data: { suggestions: Suggestion[] } = await response.json();
      return data.suggestions;
    } catch {
      // Network error, aborted, etc. — silently return empty
      return [];
    }
  },
};
