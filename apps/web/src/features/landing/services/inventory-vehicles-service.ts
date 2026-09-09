// "use cache"; // TODO: re-enable after testing

import "server-only";

import { mapInventoryCardResponseToVehicle } from "@features/search/bff";
import type { InventoryCardResponse } from "@features/search/bff/contracts/search-response.schema";
import type { Vehicle } from "@shared/components/inventory-card";
// TODO: re-enable after testing
// import { cacheLife, cacheTag } from "next/cache";
import type { LandingSectionInput } from "./landing-section-input";
import { fetchNewTodayUpstream } from "./new-today-upstream";

/**
 * Cached "New Today" inventory — calls the traditional search endpoint with
 * availability + daysInStock ≤ 7 filters, scoped to the visitor's location.
 *
 * Cache boundary: keyed by zipCode (non-secret). Auth headers (visitor ID,
 * API key) are read at request time by `createBedClient` / `resolveBedService`.
 *
 * Returns an empty array (section hidden) on upstream failure — never throws.
 */
export async function getFeaturedVehicles(
  input: LandingSectionInput = {
    zipCode: null,
    latitude: null,
    longitude: null,
    visitorId: null,
    sessionId: null,
  }
): Promise<Vehicle[]> {
  // TODO: re-enable caching after testing
  // cacheLife("landing");
  // cacheTag("new-today-inventory");
  // if (input.zipCode) {
  //   cacheTag(`new-today-inventory:${input.zipCode}`);
  // }

  const result = await fetchNewTodayUpstream(
    {
      zipCode: input.zipCode ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
    },
    {
      visitorId: input.visitorId,
      sessionId: input.sessionId,
    }
  );

  if (!result) {
    return [];
  }

  // Dedupe by VIN: upstream may surface the same vehicle more than once.
  const byId = new Map<string, Vehicle>();
  for (const card of result.data.results as InventoryCardResponse[]) {
    const vehicle = mapInventoryCardResponseToVehicle(card);
    if (!byId.has(vehicle.id)) {
      byId.set(vehicle.id, vehicle);
    }
  }

  return [...byId.values()];
}
