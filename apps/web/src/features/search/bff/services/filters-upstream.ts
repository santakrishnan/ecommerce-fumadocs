import "server-only";

import { type ResolvedBedService, SEARCH_ENDPOINTS } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { FiltersRequest } from "../contracts/filters-request.schema";
import type {
  FiltersResponse,
  FiltersUpstreamResponse,
} from "../contracts/filters-response.schema";
import {
  createFiltersError,
  type FiltersError,
  mapCaughtToFiltersError,
} from "../errors/filters.errors";
import { mapFiltersUpstreamToResponse } from "../mappers/filters.mapper";

export type FetchFiltersUpstreamResult =
  | { success: true; data: FiltersResponse }
  | { success: false; error: FiltersError };

/**
 * Calls the BED search POST /filters endpoint via createBedClient
 * and returns a `FiltersResponse`.
 */
export async function fetchFiltersUpstream(
  service: ResolvedBedService,
  request: FiltersRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<FetchFiltersUpstreamResult> {
  const client = createBedClient(service, identity);

  try {
    const raw = await client.post(
      SEARCH_ENDPOINTS.filters,
      {
        location: request.location,
        ...(request.searchId ? { searchId: request.searchId } : {}),
      },
      { headers: { "X-Trace-Id": traceId } }
    );

    // Cast to the loose upstream shape — upstream data is unvalidated at this boundary.
    const upstreamData = raw as unknown as FiltersUpstreamResponse;

    if (!(upstreamData?.data && Array.isArray(upstreamData.data.filters))) {
      return {
        success: false,
        error: createFiltersError(
          "InternalError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapFiltersUpstreamToResponse(upstreamData);

    return { success: true, data: mapped };
  } catch (error) {
    return { success: false, error: mapCaughtToFiltersError(error) };
  }
}
