"use server";

import { locationCookieNames } from "@config/cookies";
import { parseGeoCookie } from "@features/location/lib/location-cookies";
import { getSearchResults, mapInventoryCardResponseToVehicle } from "@features/search/bff";
import type { InventoryCardResponse } from "@features/search/bff/contracts/search-response.schema";
import type { Vehicle } from "@shared/components/inventory-card";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { cookies } from "next/headers";

const DEFAULT_LIMIT = 20;

export interface TaxonomySearchResult {
  success: boolean;
  vehicles: Vehicle[];
}

export interface SearchByTaxonomyOptions {
  /** Max vehicles to return. Defaults to 20. */
  limit?: number;
}

/**
 * ISO 3779 VIN pattern — 17 alphanumeric chars excluding I, O, Q.
 */
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Normalize and validate a single VIN string.
 * Returns the uppercased VIN or `null` if invalid per ISO 3779.
 */
function normalizeVin(vin: string): string | null {
  const trimmed = vin.trim().toUpperCase();
  return VIN_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Server Action: searches for similar vehicles using vinTaxonomy filter.
 *
 * Accepts a single VIN string or an array of VINs. When multiple VINs are
 * provided, uses the `values` array format supported by the upstream API.
 *
 * Reads location (ZIP + geo) and visitor identity from cookies server-side,
 * then calls the BED search endpoint with the vinTaxonomy filter. The caller
 * only passes the VIN(s) + optional limit — no cookie reading needed on the client.
 *
 * Used by:
 * - SearchRecommendationsClient (welcome-back page, limit: 20)
 * - SimilarVehicles (VDP sold page, limit: 3)
 */
export async function searchByTaxonomy(
  vinOrVins: string | string[],
  options: SearchByTaxonomyOptions = {}
): Promise<TaxonomySearchResult> {
  const vins = Array.isArray(vinOrVins) ? vinOrVins : [vinOrVins];
  const normalizedVins = vins.map(normalizeVin).filter((v): v is string => v !== null);

  if (normalizedVins.length === 0) {
    return { success: false, vehicles: [] };
  }

  const cookieStore = await cookies();
  const zipCode = cookieStore.get(locationCookieNames.ZIP)?.value ?? null;

  if (!zipCode) {
    return { success: false, vehicles: [] };
  }

  const geo = parseGeoCookie(cookieStore.get(locationCookieNames.GEO)?.value);
  const identity = await readVisitorIdentity();

  const limit = options.limit ?? DEFAULT_LIMIT;

  // Single VIN uses `value`, multiple VINs use `values` array
  const vinFilter =
    normalizedVins.length === 1
      ? { key: "vinTaxonomy" as const, value: normalizedVins[0] }
      : { key: "vinTaxonomy" as const, values: normalizedVins };

  const result = await getSearchResults(
    {
      identifierFilters: [vinFilter],
      location: {
        zipCode,
        latitude: geo?.latitude,
        longitude: geo?.longitude,
      },
      pagination: { limit, offset: 0 },
      sort: "Recommended",
    },
    crypto.randomUUID(),
    {
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
    }
  );

  if (!result.success) {
    return { success: false, vehicles: [] };
  }

  // Map, exclude source VINs, deduplicate
  const vehicles: Vehicle[] = [];
  const seen = new Set<string>(normalizedVins);
  for (const card of result.data.data.results as InventoryCardResponse[]) {
    const vehicle = mapInventoryCardResponseToVehicle(card);
    if (seen.has(vehicle.id)) {
      continue;
    }
    seen.add(vehicle.id);
    vehicles.push(vehicle);
  }

  return { success: true, vehicles };
}
