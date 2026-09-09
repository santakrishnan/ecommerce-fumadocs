import "server-only";

import { INVENTORY_CARD_FIXTURES } from "../__fixtures__/vehicle-results.fixture";
import type { SmartFilter } from "../contracts/filters-response.schema";
import type { SearchResultsApiResponse } from "../contracts/search-response.schema";
import type { SearchError } from "../errors/search.errors";
import { mockDelay } from "../lib/mock-delay";
import { mapInventoryCardResponseToVehicle } from "../mappers/search.mapper";
import { mapVehicleToInventoryCard } from "../mappers/vehicle-to-inventory-card.mapper";
import {
  filterVehiclesByActiveFilters,
  searchFiltersToActiveVehicleFilters,
  sortVehicles,
} from "./search-results-service";
import type { UpstreamSearchRequest } from "./search-upstream";

const MOCK_DELAY_MS = 50;

export type MockSearchResult =
  | { success: true; data: SearchResultsApiResponse }
  | { success: false; error: SearchError };

/**
 * Mock service for POST /api/v1/search.
 *
 * Handles real pagination against the 150-record vehicle fixture set,
 * applies sorting based on request.sort parameter, and echoes request filters
 * back as smart filters. Applies a randomized network delay when MOCK_LATENCY
 * is enabled to surface loading states in development.
 *
 * Returns an empty result set when offset is at or beyond the total fixture
 * count — this exercises the no-results UI state without a sentinel value.
 */
export async function mockSearchResults(
  request: UpstreamSearchRequest,
  traceId: string
): Promise<MockSearchResult> {
  await mockDelay(MOCK_DELAY_MS);

  const searchId = request.searchId ?? crypto.randomUUID();
  const limit = request.pagination?.limit ?? 20;
  const offset = request.pagination?.offset ?? 0;
  const timestamp = new Date().toISOString();

  // Request schema already validates filters as SmartFilter[]; echo as-is.
  const smartFilters: SmartFilter[] = request.filters ?? [];

  // Map upstream InventoryCard fixtures → flat Vehicle objects, then filter and sort.
  const allVehicles = INVENTORY_CARD_FIXTURES.map(mapInventoryCardResponseToVehicle);
  let candidates = filterVehiclesByActiveFilters(
    [...allVehicles],
    searchFiltersToActiveVehicleFilters(smartFilters)
  );

  // Start with filtered fixtures and apply sorting if requested.
  if (request.sort) {
    candidates = sortVehicles(candidates, request.sort);
  }

  // Offset at or beyond sorted candidates total → empty result set
  if (offset >= candidates.length) {
    return {
      success: true,
      data: {
        data: {
          searchId,
          totalCount: candidates.length,
          results: [],
          pagination: { limit, offset, hasMore: false },
          smartFilters,
        },
        meta: { traceId, timestamp },
      },
    };
  }

  const results = candidates.slice(offset, offset + limit).map(mapVehicleToInventoryCard);
  const hasMore = offset + limit < candidates.length;

  return {
    success: true,
    data: {
      data: {
        searchId,
        totalCount: candidates.length,
        results,
        pagination: { limit, offset, hasMore },
        smartFilters,
      },
      meta: { traceId, timestamp },
    },
  };
}
