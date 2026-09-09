import type { Vehicle } from "@shared/components/inventory-card";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SmartFilter } from "@ucmp/sdk-search-api";
import { type InventoryCard, type SortOrder, sortOrderEnum } from "@ucmp/sdk-search-api";
import { act, renderHook, waitFor } from "@ucmp/vitest-config/test-utils";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchResultsApiResponse } from "../bff/contracts/search-response.schema";
import type { PaginatedData } from "../bff/services/search-results-service";
import { SEARCH_RESULTS_PAGE_SIZE } from "../data/search-config";

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("@shared/lib/http/client-api", () => ({
  createHttpClient: () => ({
    post: mockPost,
  }),
}));

import { useSearchResultsPagination } from "../hooks/use-search-results-pagination";

// Fresh QueryClient per test — prevents cache bleed and disables retries.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
}

const baseVehicle: Vehicle = {
  id: "v-001",
  imageUrl: "/inventory-card/inventory-card1.png",
  make: "Toyota",
  mileage: 10_000,
  model: "Highlander",
  price: 41_000,
  trim: "XLE",
  year: 2023,
};

// API responses carry the SDK InventoryCard wire shape; the hook maps them to
// Vehicle at the boundary.
const baseInventoryCard: InventoryCard = {
  vin: "V0010000000000000",
  vehicleInfo: { year: 2023, make: "Toyota", model: "Highlander", trim: "XLE" },
  dealerInfo: { dealerCode: "MOCK-001", dealerName: "Mock Dealer" },
  pricing: { listPrice: 41_000 },
  status: { mileage: 10_000, vehicleStatus: "Available" },
  media: { photos: [{ url: "/inventory-card/inventory-card-01.png", displayOrder: 1 }] },
};

const initialData: PaginatedData<Vehicle> = {
  currentPage: 1,
  data: [baseVehicle],
  totalItems: 48,
  totalPages: 2,
};

function buildApiResponse(
  overrides: Partial<SearchResultsApiResponse> = {}
): SearchResultsApiResponse {
  return {
    data: {
      pagination: {
        hasMore: false,
        limit: SEARCH_RESULTS_PAGE_SIZE,
        offset: 0,
      },
      results: [baseInventoryCard],
      searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
      totalCount: 48,
    },
    meta: {
      timestamp: "2026-06-23T00:00:00.000Z",
      traceId: "trace-id",
    },
    ...overrides,
  };
}

describe("useSearchResultsPagination", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("maps selected page to limit/offset payload", async () => {
    mockPost.mockResolvedValue(
      buildApiResponse({
        data: {
          pagination: {
            hasMore: false,
            limit: SEARCH_RESULTS_PAGE_SIZE,
            offset: SEARCH_RESULTS_PAGE_SIZE,
          },
          results: [baseInventoryCard],
          searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
          totalCount: 48,
        },
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchResultsPagination({ initialData, searchId: "test-search-id" }),
      { wrapper }
    );

    // Initial render uses server-loaded initialData — no network request on mount.
    expect(mockPost).not.toHaveBeenCalled();

    act(() => {
      result.current.goToPage(2);
    });

    await waitFor(() => expect(result.current.paginatedData.currentPage).toBe(2));

    expect(mockPost).toHaveBeenCalledWith("/search", {
      pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: SEARCH_RESULTS_PAGE_SIZE },
      searchId: "test-search-id",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("includes optional searchId, sort and filters when provided", async () => {
    const filters: SmartFilter[] = [
      { key: "price", label: "Price", max: 50_000, min: 30_000, type: "Range" },
    ];

    mockPost.mockResolvedValue(buildApiResponse());

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useSearchResultsPagination({
          filters,
          initialData,
          searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
          sort: sortOrderEnum.LowestPrice,
        }),
      { wrapper }
    );

    act(() => {
      result.current.goToPage(3);
    });

    expect(mockPost).toHaveBeenCalledWith("/search", {
      filters,
      pagination: {
        limit: SEARCH_RESULTS_PAGE_SIZE,
        offset: SEARCH_RESULTS_PAGE_SIZE * 2,
      },
      searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
      sort: "LowestPrice",
    });
  });

  it("exposes an error message when the request fails", async () => {
    mockPost.mockRejectedValue(new Error("search failed"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchResultsPagination({ initialData, searchId: "test-search-id" }),
      { wrapper }
    );

    act(() => {
      result.current.goToPage(2);
    });

    await waitFor(() => expect(result.current.errorMessage).toBe("search failed"));
    expect(result.current.isLoading).toBe(false);
  });

  it("includes sort in every page request when navigating across pages", async () => {
    mockPost.mockResolvedValue(
      buildApiResponse({
        data: {
          pagination: {
            hasMore: true,
            limit: SEARCH_RESULTS_PAGE_SIZE,
            offset: SEARCH_RESULTS_PAGE_SIZE,
          },
          results: [baseInventoryCard],
          searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
          totalCount: 72,
        },
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useSearchResultsPagination({
          initialData,
          searchId: "test-search-id",
          sort: sortOrderEnum.HighestPrice,
        }),
      { wrapper }
    );

    act(() => {
      result.current.goToPage(2);
    });
    await waitFor(() => expect(result.current.paginatedData.currentPage).toBe(2));

    expect(mockPost).toHaveBeenLastCalledWith(
      "/search",
      expect.objectContaining({
        sort: "HighestPrice",
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: SEARCH_RESULTS_PAGE_SIZE },
      })
    );

    act(() => {
      result.current.goToPage(3);
    });
    await waitFor(() => expect(result.current.paginatedData.currentPage).toBe(3));

    expect(mockPost).toHaveBeenLastCalledWith(
      "/search",
      expect.objectContaining({
        sort: "HighestPrice",
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: SEARCH_RESULTS_PAGE_SIZE * 2 },
      })
    );
  });

  it("refetches page 1 when sort changes while already on page 1", async () => {
    mockPost.mockResolvedValue(buildApiResponse());

    const { wrapper } = createWrapper();
    const { rerender } = renderHook(
      ({ sort }: { sort: SortOrder }) =>
        useSearchResultsPagination({ initialData, searchId: "test-search-id", sort }),
      { initialProps: { sort: sortOrderEnum.Recommended as SortOrder }, wrapper }
    );

    // No network request yet — initialData seeds the cache for Recommended + page 1.
    expect(mockPost).not.toHaveBeenCalled();

    // Sort changes → new query key → TQ fires a fetch automatically.
    rerender({ sort: sortOrderEnum.LowestPrice });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    expect(mockPost).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        sort: "LowestPrice",
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: 0 },
      })
    );
  });

  it("refetches page 1 when filters change while already on page 1", async () => {
    mockPost.mockResolvedValue(buildApiResponse());

    const newFilters: SmartFilter[] = [
      {
        key: "model",
        label: "Highlander",
        type: "Enum",
        options: [{ count: 5, label: "Highlander", value: "Highlander" }],
      },
    ];

    const { wrapper } = createWrapper();
    const { rerender } = renderHook(
      ({ filters }: { filters?: SmartFilter[] }) =>
        useSearchResultsPagination({ initialData, searchId: "test-search-id", filters }),
      { initialProps: { filters: undefined as SmartFilter[] | undefined }, wrapper }
    );

    expect(mockPost).not.toHaveBeenCalled();

    // Filters change → new query key → TQ fires a fetch automatically.
    rerender({ filters: newFilters });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

    expect(mockPost).toHaveBeenCalledWith(
      "/search",
      expect.objectContaining({
        filters: newFilters,
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: 0 },
      })
    );
  });

  it("includes filters in every page request when navigating across pages", async () => {
    const filters: SmartFilter[] = [
      { key: "price", label: "Price", type: "Range", min: 30_000, max: 50_000 },
    ];

    mockPost.mockResolvedValue(
      buildApiResponse({
        data: {
          pagination: {
            hasMore: true,
            limit: SEARCH_RESULTS_PAGE_SIZE,
            offset: SEARCH_RESULTS_PAGE_SIZE,
          },
          results: [baseInventoryCard],
          searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
          totalCount: 72,
        },
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSearchResultsPagination({ initialData, searchId: "test-search-id", filters }),
      { wrapper }
    );

    act(() => {
      result.current.goToPage(2);
    });
    await waitFor(() => expect(result.current.paginatedData.currentPage).toBe(2));

    expect(mockPost).toHaveBeenLastCalledWith(
      "/search",
      expect.objectContaining({
        filters,
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: SEARCH_RESULTS_PAGE_SIZE },
      })
    );

    act(() => {
      result.current.goToPage(3);
    });
    await waitFor(() => expect(result.current.paginatedData.currentPage).toBe(3));

    expect(mockPost).toHaveBeenLastCalledWith(
      "/search",
      expect.objectContaining({
        filters,
        pagination: { limit: SEARCH_RESULTS_PAGE_SIZE, offset: SEARCH_RESULTS_PAGE_SIZE * 2 },
      })
    );
  });
});
