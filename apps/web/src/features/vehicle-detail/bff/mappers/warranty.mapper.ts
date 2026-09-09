import type { VehicleWarranty } from "@ucmp/sdk-search-api";

/**
 * Extracts a single display string from warranty data.
 * Prefers powertrain, falls back to basic, then a generic default.
 */
export function formatWarrantyValue(warranty: VehicleWarranty): string {
  if (warranty.powertrain && warranty.powertrain.trim().length > 0) {
    return warranty.powertrain.trim();
  }

  if (warranty.basic && warranty.basic.trim().length > 0) {
    return warranty.basic.trim();
  }

  return "Warranty included";
}
