import "server-only";

import { resolveBedService, SEARCH_ENDPOINTS } from "@config/bed-services";
import { env } from "@config/env";
import { APP_LOCATION_DEFAULTS } from "@config/location-defaults";
import type { SearchResultsApiResponse } from "@features/search/bff/contracts/search-response.schema";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { createBedClient } from "@shared/lib/http/bed-client";

/**
 * Calls the BED search endpoint with "New Today" filters:
 * - availability: "Available"
 * - daysInStock: max 7 (listed in the last week)
 *
 * Uses raw Arrow filters (not SmartFilter) because "availability" and
 * "daysInStock" are not in the SDK's `dimensionIdEnum` used by the search
 * BFF schema. This keeps the search BFF schema strict while allowing the
 * landing feature to use custom upstream filter keys.
 *
 * Returns null when the search service is not configured or on failure.
 */
export async function fetchNewTodayUpstream(
  location: { zipCode?: string; latitude?: number; longitude?: number },
  identity: BedVisitorIdentity
): Promise<SearchResultsApiResponse | null> {
  if (env.USE_SEARCH_RESULTS_MOCKS === "true") {
    return null;
  }

  // Skip the call on cold start — no location cookie means the visitor profile
  // hasn't resolved yet. The section will populate on the next page load once
  // fingerprint/resolve sets the ZIP + geo cookies.
  if (!location.zipCode) {
    return null;
  }

  const service = resolveBedService("search");
  if (!service) {
    return null;
  }

  const client = createBedClient(service, identity.visitorId ? identity : undefined);

  const daysInStock = env.NEW_TODAY_DAYS_IN_STOCK ?? 12;
  const limit = env.NEW_TODAY_LIMIT ?? 10;

  const searchData = {
    filters: [
      { key: "availability", values: ["Available"] },
      { key: "daysInStock", max: daysInStock },
    ],
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
    const response = (await client.post(SEARCH_ENDPOINTS.results, searchData)) as {
      data?: { results?: unknown; searchId?: unknown; totalCount?: unknown };
      meta?: unknown;
    };

    if (
      !(response?.data && Array.isArray(response.data.results)) ||
      typeof response.data.totalCount !== "number"
    ) {
      console.warn("[fetchNewTodayUpstream] Unexpected response shape");
      return null;
    }

    return response as unknown as SearchResultsApiResponse;
  } catch (error) {
    console.warn("[fetchNewTodayUpstream] Upstream call failed", error);
    return null;
  }
}
