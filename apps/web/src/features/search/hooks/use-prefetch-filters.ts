"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_FILTER_LOCATION,
  type FilterLocation,
  filterQueryOptions,
} from "../lib/filter-query-options";

/**
 * Prefetches filter data into the React Query cache so it's instantly
 * available when the user lands on the results page and opens the filter dialog.
 *
 * Passes `searchId` to the upstream so it returns smart filters scoped to
 * the active search session (correct counts, available options).
 *
 * Uses the same query options as `useFilterData` — the dialog picks it up
 * with zero additional network calls. `prefetchQuery` is idempotent: if data
 * is already cached or in-flight, it noops.
 *
 * `location` accepts `undefined` (from `useSearchLocation`) and defaults when absent.
 */
export function usePrefetchFilters(
  enabled = false,
  location: FilterLocation | undefined = DEFAULT_FILTER_LOCATION,
  searchId?: string
) {
  const queryClient = useQueryClient();

  if (enabled && searchId) {
    queryClient.prefetchQuery(filterQueryOptions({ location, searchId }));
  }
}
