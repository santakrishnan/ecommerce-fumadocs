import type { SearchResultsApiResponse } from "../contracts/search-response.schema";
import { mapVehicleToInventoryCard } from "../mappers/vehicle-to-inventory-card.mapper";
import { VEHICLE_FIXTURES } from "./vehicle-results.fixture";

const TOTAL_COUNT = VEHICLE_FIXTURES.length; // 150

/**
 * Fixture for a successful search response.
 *
 * Slices the first 20 records from the deterministic vehicle fixture set and
 * maps them to the SDK `InventoryCard` wire shape emitted by the search BFF.
 * Includes two sample smart filters (price range + make enum) that reflect
 * what the mock service echoes back from a request containing those filters.
 *
 * Static meta fields ensure deterministic snapshots in tests.
 */
export const SEARCH_SUCCESS_FIXTURE: SearchResultsApiResponse = {
  data: {
    searchId: "e23a7b10-44cc-4f12-b890-1a2b3c4d5e6f",
    totalCount: TOTAL_COUNT,
    results: VEHICLE_FIXTURES.slice(0, 20).map(mapVehicleToInventoryCard),
    pagination: {
      limit: 20,
      offset: 0,
      hasMore: TOTAL_COUNT > 20,
    },
    smartFilters: [
      {
        key: "price",
        label: "Price",
        type: "Range",
        min: 28_000,
        max: 52_000,
      },
      {
        key: "make",
        label: "Make",
        type: "Enum",
        options: [{ value: "Toyota", count: TOTAL_COUNT }],
      },
    ],
  },
  meta: {
    traceId: "fixture-trace-id",
    timestamp: "2026-06-19T00:00:00.000Z",
  },
};

/**
 * Fixture for an empty search response (no matching results).
 *
 * Note: the current mock service only returns empty `results` when the requested offset
 * is at or beyond the fixture count; it does not yet simulate query/filter matching.
 */
export const SEARCH_EMPTY_FIXTURE: SearchResultsApiResponse = {
  data: {
    searchId: "00000000-0000-0000-0000-000000000000",
    totalCount: 0,
    results: [],
    pagination: {
      limit: 20,
      offset: 0,
      hasMore: false,
    },
    smartFilters: [],
  },
  meta: {
    traceId: "fixture-trace-id-empty",
    timestamp: "2026-06-19T00:00:00.000Z",
  },
};
