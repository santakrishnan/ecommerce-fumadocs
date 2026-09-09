import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { FiltersRequest } from "../contracts/filters-request.schema";
import type { FiltersResponse } from "../contracts/filters-response.schema";
import { createFiltersError, type FiltersError } from "../errors/filters.errors";
import { mockGetFilters } from "../services/filters-mock";
import { fetchFiltersUpstream } from "../services/filters-upstream";

export type GetFiltersResult =
  | { success: true; data: FiltersResponse }
  | { success: false; error: FiltersError };

/**
 * Use case: fetch available search filter dimensions for the given location/context.
 *
 * - `USE_FILTERS_MOCKS=true`                                   → returns mock data (always wins)
 * - `API_UPSTREAM_URL` + `SEARCH_API_KEY` set via resolveBedService   → calls the BED search API
 * - Service not resolved                                        → 503 (misconfiguration)
 */
export async function getFilters(
  request: FiltersRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<GetFiltersResult> {
  if (env.USE_FILTERS_MOCKS === "true") {
    const data = await mockGetFilters(request);
    return { success: true, data };
  }

  const service = resolveBedService("search");
  if (!service) {
    return {
      success: false,
      error: createFiltersError(
        "ServiceUnavailable",
        "Search upstream service is not configured (API_UPSTREAM_URL + SEARCH_API_KEY)",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  return fetchFiltersUpstream(service, request, traceId, identity);
}
