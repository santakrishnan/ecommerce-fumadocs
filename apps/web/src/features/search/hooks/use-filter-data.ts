"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_FILTER_LOCATION,
  type FilterLocation,
  type FilterQueryResult,
  filterQueryOptions,
} from "../lib/filter-query-options";

/**
 * Fetches filter dimensions from the BFF route handler and maps them
 * to the UI-level FilterSectionMockData shape.
 *
 * Uses TanStack React Query for dedup, caching, retry, and loading state.
 * Falls back gracefully — callers should use the mock data fallback
 * when data is undefined (handled by FilterContentPanel).
 */
export function useFilterData(
  location: FilterLocation = DEFAULT_FILTER_LOCATION,
  searchId?: string
) {
  return useQuery<FilterQueryResult>(filterQueryOptions({ location, searchId }));
}
