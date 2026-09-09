import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import { APP_LOCATION_DEFAULTS } from "@config/location-defaults";
import type { SearchResultsApiResponse } from "@features/search/bff/contracts/search-response.schema";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { createBedClient } from "@shared/lib/http/bed-client";

/**
 * Calls the BED search endpoint with "Rare Finds" filters:
 * - isLuxury: true (boolean filter for luxury/high-value vehicles)
 *
 * Uses raw Arrow filters (not SmartFilter) because "isLuxury" is not in the
 * SDK's `dimensionIdEnum`. Follows the same pattern as `fetchNewTodayUpstream`.
 *
 * Returns null when the search service is not configured or on failure.
 */
export async function fetchRareFindsUpstream(
  location: { zipCode?: string; latitude?: number; longitude?: number },
  identity: BedVisitorIdentity
): Promise<SearchResultsApiResponse | null> {
  if (env.USE_SEARCH_RESULTS_MOCKS === "true") {
    return null;
  }

  if (!location.zipCode) {
    return null;
  }

  const service = resolveBedService("search");
  if (!service) {
    return null;
  }

  const client = createBedClient(service, identity);

  const limit = env.RARE_FINDS_LIMIT ?? 3;

  const searchData = {
    filters: [{ key: "isLuxury", value: true }],
    location: {
      zipCode: location.zipCode,
      latitude: location.latitude ?? APP_LOCATION_DEFAULTS.lat,
      longitude: location.longitude ?? APP_LOCATION_DEFAULTS.lng,
    },
    pagination: {
      limit,
      offset: 0,
    },
  };

  try {
    const response = (await client.post("/search", searchData)) as {
      data?: { results?: unknown; searchId?: unknown; totalCount?: unknown };
      meta?: unknown;
    };

    if (
      !(response?.data && Array.isArray(response.data.results)) ||
      typeof response.data.totalCount !== "number"
    ) {
      console.warn("[fetchRareFindsUpstream] Unexpected response shape");
      return null;
    }

    return response as unknown as SearchResultsApiResponse;
  } catch (error) {
    console.warn("[fetchRareFindsUpstream] Upstream call failed", error);
    return null;
  }
}
