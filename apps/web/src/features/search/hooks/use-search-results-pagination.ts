"use client";

import type { Vehicle } from "@shared/components/inventory-card";
import { createHttpClient } from "@shared/lib/http/client-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SmartFilter, SortOrder } from "@ucmp/sdk-search-api";
import { useRef, useState } from "react";
import type { SearchResultsApiResponse } from "../bff/contracts/search-response.schema";
import type { PaginatedData } from "../bff/services/search-results-service";
import { SEARCH_RESULTS_PAGE_SIZE } from "../data/search-config";
import { mapSdkInventoryCardToVehicle } from "../lib/card-mappers/map-sdk-inventory-card-to-vehicle";

const searchResultsClient = createHttpClient({}, {}, { baseUrl: "/api/v1" });

export interface UseSearchResultsPaginationInput {
  filters?: SmartFilter[];
  initialData: PaginatedData<Vehicle>;
  /** Starting page number (from URL param). Defaults to initialData.currentPage. */
  initialPage?: number;
  /** Sort order that produced initialData (SSR). Defaults to sort. */
  initialSort?: SortOrder;
  searchId: string;
  sort?: SortOrder;
}

export interface UseSearchResultsPaginationReturn {
  errorMessage: string | null;
  goToPage: (pageNumber: number) => Promise<void>;
  isLoading: boolean;
  paginatedData: PaginatedData<Vehicle>;
}

interface SearchRequestPayload {
  filters?: SmartFilter[];
  pagination: {
    limit: number;
    offset: number;
  };
  searchId: string;
  sort?: SortOrder;
}

function toPaginatedData(
  response: SearchResultsApiResponse,
  currentPage: number
): PaginatedData<Vehicle> {
  const totalItems = response.data.totalCount;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / response.data.pagination.limit);

  return {
    currentPage,
    data: response.data.results.map(mapSdkInventoryCardToVehicle),
    totalItems,
    totalPages,
  };
}

function toSafePageNumber(pageNumber: number): number {
  return Number.isFinite(pageNumber) ? Math.max(1, Math.floor(pageNumber)) : 1;
}

function buildSearchRequestPayload(input: {
  filters?: SmartFilter[];
  pageNumber: number;
  searchId: string;
  sort?: SortOrder;
}): SearchRequestPayload {
  const payload: SearchRequestPayload = {
    pagination: {
      limit: SEARCH_RESULTS_PAGE_SIZE,
      offset: (input.pageNumber - 1) * SEARCH_RESULTS_PAGE_SIZE,
    },
    searchId: input.searchId,
  };

  if (input.filters && input.filters.length > 0) {
    payload.filters = input.filters;
  }

  if (input.sort) {
    payload.sort = input.sort;
  }

  return payload;
}

async function fetchSearchResults(input: {
  filters?: SmartFilter[];
  pageNumber: number;
  searchId: string;
  sort?: SortOrder;
}): Promise<PaginatedData<Vehicle>> {
  const payload = buildSearchRequestPayload(input);
  const response = await searchResultsClient.post<SearchResultsApiResponse>("/search", payload);
  return toPaginatedData(response, input.pageNumber);
}

/**
 * Client-side pagination controller for the search results shell.
 *
 * Uses TanStack Query to cache each unique (searchId, sort, filters, page)
 * combination for 5 minutes — matching the server-side `"search"` cache
 * profile. Back-and-forward navigation between previously visited pages
 * reuses the TQ cache without issuing a network request.
 *
 * The server-loaded `initialData` seeds the TQ cache for the first render,
 * preventing a duplicate network request on mount. `initialData` is only
 * seeded for the exact (sort, filters) combination present at mount time so
 * that subsequent sort/filter changes always fetch fresh results.
 */
export function useSearchResultsPagination({
  filters,
  initialData,
  initialPage,
  initialSort,
  searchId,
  sort,
}: UseSearchResultsPaginationInput): UseSearchResultsPaginationReturn {
  const [page, setPage] = useState(initialPage ?? initialData.currentPage);
  const filtersKey = JSON.stringify(filters ?? []);

  // The sort that produced the SSR initialData — captured once at mount.
  const ssrSortRef = useRef(initialSort ?? sort);
  // Capture filtersKey at mount so initialData only seeds the TQ cache for
  // the original SSR query — not for later filter changes.
  const initialFiltersKeyRef = useRef(filtersKey);
  // Stable timestamp so TQ treats the SSR data as fresh on first render.
  const initialDataUpdatedAtRef = useRef(Date.now());

  // SSR data is only valid for page 1 + the SSR sort + initial filters.
  const isInitialQuery =
    page === initialData.currentPage &&
    sort === ssrSortRef.current &&
    filtersKey === initialFiltersKeyRef.current;

  const { data, isFetching, error } = useQuery({
    queryKey: ["search-results", searchId, sort ?? null, filtersKey, page],
    queryFn: () => fetchSearchResults({ filters, pageNumber: page, searchId, sort }),
    initialData: isInitialQuery ? initialData : undefined,
    initialDataUpdatedAt: isInitialQuery ? initialDataUpdatedAtRef.current : undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const paginatedData = data ?? initialData;

  let errorMessage: string | null = null;
  if (error != null) {
    errorMessage = error instanceof Error ? error.message : "Unable to load search results.";
  }

  async function goToPage(pageNumber: number): Promise<void> {
    setPage(toSafePageNumber(pageNumber));
  }

  return {
    errorMessage,
    goToPage,
    isLoading: isFetching,
    paginatedData,
  };
}
