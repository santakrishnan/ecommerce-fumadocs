// "use cache"; // TODO: re-enable after testing

import "server-only";

import { mapInventoryCardResponseToVehicle } from "@features/search/bff";
import type { InventoryCardResponse } from "@features/search/bff/contracts/search-response.schema";
import type { Vehicle } from "@shared/components/inventory-card";
// TODO: re-enable after testing
// import { cacheLife, cacheTag } from "next/cache";
import type { LandingSectionInput } from "./landing-section-input";
import { fetchRareFindsUpstream } from "./rare-finds-upstream";

/**
 * Cached "Rare Finds" inventory — calls the traditional search endpoint with
 * isLuxury filter, sorted by highest price, scoped to the visitor's location.
 *
 * Returns an empty array (section hidden) on upstream failure — never throws.
 */
export async function getRareFinds(
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
  // cacheTag("rare-finds");
  // if (input.zipCode) {
  //   cacheTag(`rare-finds:${input.zipCode}`);
  // }

  const result = await fetchRareFindsUpstream(
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

  // Dedupe by VIN
  const byId = new Map<string, Vehicle>();
  for (const card of result.data.results as InventoryCardResponse[]) {
    const vehicle = mapInventoryCardResponseToVehicle(card);
    if (!byId.has(vehicle.id)) {
      byId.set(vehicle.id, vehicle);
    }
  }

  return [...byId.values()];
}
