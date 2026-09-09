import "server-only";

import { type ResolvedBedService, SEARCH_ENDPOINTS } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { Filter as ArrowFilter } from "@ucmp/sdk-search-api";
import type { SmartFilter } from "../contracts/filters-response.schema";
import type { SearchRequest } from "../contracts/search-request.schema";
import type { SearchResultsApiResponse } from "../contracts/search-response.schema";
import {
  createSearchError,
  mapCaughtToSearchError,
  type SearchError,
} from "../errors/search.errors";

/**
 * Internal extension of SearchRequest for server-side callers that need
 * to pass SDK identifier filters (vin, vinTaxonomy) directly without going
 * through the SmartFilter schema. Not exposed in the public BFF contract.
 *
 * `location` is optional here — `fetchSearchUpstream` falls back to
 * DEFAULT_LOCATION when omitted. The public schema keeps it required
 * (route handler injects it before validation).
 */
export interface UpstreamSearchRequest extends Omit<SearchRequest, "location" | "filters"> {
  /** SmartFilters — accepts both the narrow Zod-inferred type and the wider SDK SmartFilter[]. */
  filters?: SmartFilter[];
  /** Raw SDK Filter objects merged into the upstream request (e.g. vinTaxonomy). */
  identifierFilters?: ArrowFilter[];
  /** Resolved visitor location. Falls back to DEFAULT_LOCATION when omitted. */
  location?: {
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    radiusMiles?: number;
  };
}

/** Fallback location used when the request carries no location context. */
const DEFAULT_LOCATION: {
  zipCode: string;
  latitude: number;
  longitude: number;
  radiusMiles?: number;
} = {
  zipCode: "91711",
  latitude: 34.0966,
  longitude: -117.7198,
};

/**
 * Maps the rich SmartFilter response shape back to the flat Arrow Filter
 * request shape. SmartFilters carry display metadata (label, count) that
 * the upstream does not accept — only the key + constraint fields are sent.
 */
function toArrowFilters(smartFilters: SmartFilter[]): ArrowFilter[] {
  return smartFilters.flatMap((filter) => {
    if (filter.type === "Enum" || filter.type === "MultiEnum") {
      if (filter.options.length === 0) {
        return [];
      }
      const values = filter.options.map((o) => o.value as string | number);
      return [{ key: filter.key, values }];
    }

    if (filter.type === "Range") {
      const entry: ArrowFilter = { key: filter.key };
      if (filter.min !== undefined) {
        entry.min = filter.min;
      }
      if (filter.max !== undefined) {
        entry.max = filter.max;
      }
      return [entry];
    }

    if (filter.type === "Boolean") {
      return [{ key: filter.key, value: true as const }];
    }

    return [];
  });
}

export type FetchSearchUpstreamResult =
  | { success: true; data: SearchResultsApiResponse }
  | { success: false; error: SearchError };

/**
 * Calls the BED search POST /search endpoint via createBedClient
 * and returns a `SearchResultsApiResponse`.
 *
 * The BED API response wire shape is structurally identical to the
 * internal `SearchResultsApiResponse` (same generated types), so no
 * response mapper is needed.
 */
export async function fetchSearchUpstream(
  service: ResolvedBedService,
  request: UpstreamSearchRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<FetchSearchUpstreamResult> {
  const client = createBedClient(service, identity);

  const location = request.location ?? DEFAULT_LOCATION;

  const searchData = {
    ...(request.searchId ? { searchId: request.searchId } : {}),
    ...(request.query ? { query: request.query } : {}),
    filters: [
      ...(request.filters ? toArrowFilters(request.filters) : []),
      ...(request.identifierFilters ?? []),
    ],
    location: {
      zipCode: location.zipCode ?? DEFAULT_LOCATION.zipCode,
      latitude: location.latitude ?? DEFAULT_LOCATION.latitude,
      longitude: location.longitude ?? DEFAULT_LOCATION.longitude,
      ...(location.radiusMiles ? { radiusMiles: location.radiusMiles } : {}),
    },
    ...(request.locationOverride ? { locationOverride: request.locationOverride } : {}),
    sort: request.sort,
    pagination: request.pagination,
  };

  try {
    const response = (await client.post(SEARCH_ENDPOINTS.results, searchData, {
      headers: { "X-Trace-Id": traceId },
    })) as {
      data?: { results?: unknown; searchId?: unknown; totalCount?: unknown };
    };

    // Structural validation — ensure the BED response has the expected shape.
    if (
      !response?.data ||
      typeof response.data.searchId !== "string" ||
      !Array.isArray(response.data.results) ||
      typeof response.data.totalCount !== "number"
    ) {
      return {
        success: false,
        error: createSearchError(
          "InternalError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: response as unknown as SearchResultsApiResponse };
  } catch (error) {
    return { success: false, error: mapCaughtToSearchError(error) };
  }
}
