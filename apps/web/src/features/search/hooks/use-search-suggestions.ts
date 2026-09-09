"use client";

import type {
  AutocompleteService,
  Suggestion,
} from "@features/search/bff/contracts/autocomplete-response.schema";
import { useEffect, useRef, useState } from "react";
import { SEARCH_CONFIG } from "../data/search-config";

/** Options for the useSearchSuggestions hook. */
interface UseSearchSuggestionsOptions {
  /** Maximum suggestions to return. Default: 6 */
  maxSuggestions?: number;
  /** Minimum characters before fetching suggestions. Default: 2 */
  minChars?: number;
}

/** Return type for the useSearchSuggestions hook. */
export interface UseSearchSuggestionsReturn {
  /** Clear the current suggestions list. */
  clearSuggestions: () => void;
  /** Whether a fetch is currently in-flight. */
  isLoading: boolean;
  /** Current list of autocomplete suggestions. */
  suggestions: Suggestion[];
}

/**
 * Hook that debounces user input and fetches autocomplete suggestions
 * from the injected AutocompleteService.
 *
 * - Gated by minChars threshold (AC-8)
 * - Silently handles errors (AC-9)
 * - Caps results to maxSuggestions
 * - Debounces requests by configured delay
 * - Discards stale responses via request ID tracking
 */
export function useSearchSuggestions(
  service: AutocompleteService,
  query: string,
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const { minChars = 2, maxSuggestions = 6 } = options;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (query.trim().length < minChars) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const currentId = ++requestIdRef.current;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await service.getSuggestions(query);
        if (currentId === requestIdRef.current) {
          setSuggestions(results.slice(0, maxSuggestions));
        }
      } catch {
        if (currentId === requestIdRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [service, query, minChars, maxSuggestions]);

  // React Compiler handles memoisation — no useCallback needed.
  function clearSuggestions() {
    setSuggestions([]);
  }

  return { clearSuggestions, isLoading, suggestions };
}
