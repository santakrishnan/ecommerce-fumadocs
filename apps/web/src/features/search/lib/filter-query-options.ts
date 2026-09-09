import type { QueryKey } from "@tanstack/react-query";
import type {
  FiltersResponse,
  SelectedContextFilter,
} from "../bff/contracts/filters-response.schema";
import { mapFiltersToUI } from "../bff/mappers/filters-to-ui.mapper";
import type { FilterSectionMockData } from "../components/filters-dialog/filter-mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterLocation {
  latitude: number;
  longitude: number;
  zipCode: string;
}

export type FilterDataMap = Record<string, FilterSectionMockData>;

export interface FilterQueryResult {
  filters: FilterDataMap;
  selectedContextFilters: SelectedContextFilter[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_FILTER_LOCATION: FilterLocation = {
  latitude: 34.0901,
  longitude: -118.4065,
  zipCode: "90210",
};

// ─── Query options factory ────────────────────────────────────────────────────

interface FilterQueryParams {
  location?: FilterLocation;
  /** When provided, upstream returns smart filters scoped to this search session. */
  searchId?: string;
}

/**
 * Returns a stable queryKey + queryFn pair for the filters query.
 * Use with `useQuery`, `prefetchQuery`, or any React Query API to ensure
 * a single cache entry and zero duplication of fetch logic.
 *
 * The cache key includes both zipCode and searchId so different search
 * sessions get correctly scoped filter counts.
 */
export function filterQueryOptions({
  location = DEFAULT_FILTER_LOCATION,
  searchId,
}: FilterQueryParams = {}) {
  return {
    queryKey: ["filters", location.zipCode, searchId ?? "default"] as QueryKey,
    queryFn: async (): Promise<FilterQueryResult> => {
      const body: Record<string, unknown> = { location };
      if (searchId) {
        body.searchId = searchId;
      }

      const response = await fetch("/api/v1/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Filters fetch failed: ${response.status}`);
      }

      const json = (await response.json()) as FiltersResponse;
      return {
        filters: mapFiltersToUI(json.data.filters),
        selectedContextFilters: json.data.selectedContextFilters ?? [],
      };
    },
  };
}
