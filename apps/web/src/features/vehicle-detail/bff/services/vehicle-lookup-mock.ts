import "server-only";

import {
  VDP_VEHICLES_BY_VIN,
  VDP_VINS,
} from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import type { VehicleDetailWithSoldAt } from "../contracts/vehicle-detail-with-sold-at";

const MOCK_DELAY_MS = 50;

export type VehicleLookupResult =
  | { success: true; data: VehicleDetailWithSoldAt }
  | { success: false; notFound: true };

/**
 * Mock vehicle lookup — returns fixture data by VIN.
 * Mirrors the upstream `POST /vehicles` single-VIN lookup.
 *
 * When the requested VIN is not in the fixture registry, falls back to the
 * default Highlander fixture (re-keyed to the requested VIN) so that inventory
 * cards linking to VINs outside the demo set still render a VDP page instead
 * of showing "Vehicle not found".
 */
export async function mockVehicleLookup(vin: string): Promise<VehicleLookupResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const upperVin = vin.toUpperCase();
  const vehicle = VDP_VEHICLES_BY_VIN[upperVin];

  if (vehicle) {
    return { success: true, data: vehicle };
  }

  // Fall back to the default fixture with the requested VIN so the VDP renders
  const fallback = VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderDefault];
  if (!fallback) {
    return { success: false, notFound: true };
  }

  return { success: true, data: { ...fallback, vin: upperVin } };
}
