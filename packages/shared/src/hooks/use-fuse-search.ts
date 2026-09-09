"use client";

import Fuse, { type IFuseOptions } from "fuse.js";
import { useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseFuseSearchOptions<T> extends Omit<IFuseOptions<T>, "keys"> {
  /** Controlled query value. When provided, the hook skips its internal state. */
  controlledQuery?: string;
  /** Fields to index for fuzzy matching. Required. */
  keys: IFuseOptions<T>["keys"] & {};
  /** Max number of results to return. Defaults to 20. */
  limit?: number;
  /** Minimum query length before searching. Defaults to 2. */
  minQueryLength?: number;
}

export interface UseFuseSearchResult<T> {
  /** Clear the search query and reset results. */
  clearQuery: () => void;
  /** Whether results were found for the current query. */
  hasResults: boolean;
  /** Whether a search is active (query meets minimum length). */
  isSearching: boolean;
  /** Current search query. */
  query: string;
  /** Fuzzy-matched results for the current query. */
  results: T[];
  /** Update the search query. */
  setQuery: (query: string) => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLD = 0.4;
const DEFAULT_DISTANCE = 100;
const DEFAULT_MIN_MATCH_CHAR_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const DEFAULT_MIN_QUERY_LENGTH = 2;

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Generic fuzzy-search hook powered by Fuse.js.
 *
 * Builds a Fuse index from `items` and returns search results as the query
 * changes. The index is rebuilt only when the `items` reference changes.
 *
 * Supports both uncontrolled (internal state) and controlled (external query)
 * modes via the `controlledQuery` option.
 *
 * @example
 * ```tsx
 * // Uncontrolled — hook owns the query state
 * const { query, setQuery, results } = useFuseSearch(specs, {
 *   keys: ["label", "value"],
 *   limit: 10,
 * });
 *
 * // Controlled — parent owns the query state
 * const { results } = useFuseSearch(specs, {
 *   keys: ["label", "value"],
 *   controlledQuery: parentQuery,
 * });
 * ```
 */
export function useFuseSearch<T>(
  items: readonly T[],
  options: UseFuseSearchOptions<T>
): UseFuseSearchResult<T> {
  const {
    controlledQuery,
    keys,
    limit = DEFAULT_LIMIT,
    minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
    threshold = DEFAULT_THRESHOLD,
    distance = DEFAULT_DISTANCE,
    minMatchCharLength = DEFAULT_MIN_MATCH_CHAR_LENGTH,
    shouldSort = true,
    ...restOptions
  } = options;

  const [internalQuery, setInternalQuery] = useState("");

  const isControlled = controlledQuery !== undefined;
  const query = isControlled ? controlledQuery : internalQuery;

  // Track the items reference to rebuild the Fuse index only when data changes.
  const itemsRef = useRef(items);
  const fuseRef = useRef<Fuse<T> | null>(null);

  if (itemsRef.current !== items || fuseRef.current === null) {
    itemsRef.current = items;
    fuseRef.current = new Fuse([...items], {
      keys,
      threshold,
      distance,
      minMatchCharLength,
      shouldSort,
      ...restOptions,
    });
  }

  const trimmed = query.trim();
  const isSearching = trimmed.length >= minQueryLength;

  const results: T[] = isSearching
    ? fuseRef.current.search(trimmed, { limit }).map((r) => r.item)
    : [];

  function clearQuery() {
    if (!isControlled) {
      setInternalQuery("");
    }
  }

  function setQuery(value: string) {
    if (!isControlled) {
      setInternalQuery(value);
    }
  }

  return {
    clearQuery,
    hasResults: results.length > 0,
    isSearching,
    query,
    results,
    setQuery,
  };
}
