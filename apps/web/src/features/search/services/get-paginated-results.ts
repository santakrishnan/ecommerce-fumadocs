import "server-only";

import type { Vehicle } from "@shared/components/inventory-card";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { SmartFilter } from "@ucmp/sdk-search-api";
import { cacheLife, cacheTag } from "next/cache";
import { getSearchResults } from "../bff";
import type { PaginatedData } from "../bff/services/search-results-service";
import { SEARCH_CONFIG } from "../data/search-config";
import { mapSdkInventoryCardToVehicle } from "../lib/card-mappers/map-sdk-inventory-card-to-vehicle";

/** Visitor location resolved from cookies by the caller (outside the cache scope). */
interface PaginatedResultsLocation {
  latitude?: number;
  longitude?: number;
  zipCode?: string;
}

/**
 * Returns the first page of search results for a given search context.
 *
 * When `agentFilters` are provided (from ?f= query params in dev mode),
 * they are forwarded to the search API so the results page shows the
 * agent-scoped inventory. In production, Arrow recalls session context
 * via searchId server-side — no filters param needed.
 *
 * @param searchId - The search context identifier from the URL `[id]` segment.
 * @param agentFilters - Optional agent-supplied filters (dev mode only).
 * @param identity - Visitor identity {visitorId, sessionId} from cookies, passed in as arg (use cache boundary).
 * @param location - Visitor location from cookies, read by the caller; part of the cache key.
 */
export async function getPaginatedResults(
  searchId: string,
  agentFilters?: SmartFilter[],
  identity: BedVisitorIdentity = {},
  location?: PaginatedResultsLocation
): Promise<PaginatedData<Vehicle>> {
  "use cache";
  cacheLife("search");
  cacheTag(`search-results-${searchId}`);

  const limit = SEARCH_CONFIG.PAGE_SIZE;

  const response = await getSearchResults(
    {
      pagination: {
        limit,
        offset: 0,
      },
      searchId,
      ...(agentFilters && agentFilters.length > 0 ? { filters: agentFilters } : {}),
      ...(location && Object.keys(location).length > 0 ? { location } : {}),
      sort: "Recommended",
    },
    crypto.randomUUID(),
    identity
  );

  if (!response.success) {
    throw new Error(
      `${response.error.message} (code=${response.error.code}, status=${response.error.status})`
    );
  }

  const totalItems = response.data.data.totalCount;
  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / response.data.data.pagination.limit);
  const vehicles: Vehicle[] = response.data.data.results.map(mapSdkInventoryCardToVehicle);

  return {
    currentPage: 1,
    data: vehicles,
    totalItems,
    totalPages,
  };
}
