import type { Vehicle } from "@shared/components/inventory-card";
import { normalizeLocalhostImageUrl } from "utils";

/** Compose a display title from make/model/trim, skipping empty parts. */
export function composeVehicleTitle(vehicle: Vehicle): string {
  return [vehicle.make, vehicle.model, vehicle.trim]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim())
    .join(" ");
}

/** Compose alt text from year/make/model/trim. */
export function composeVehicleAlt(vehicle: Vehicle): string {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .map((part) => (typeof part === "number" ? String(part) : part?.trim()))
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
}

/**
 * Maps a Vehicle object to the flat props expected by VehicleCard.
 * Does NOT include isSelected, variant, priority, trailing, or className
 * — those are set by the consumer.
 */
export function toVehicleCardProps(vehicle: Vehicle) {
  return {
    title: composeVehicleTitle(vehicle),
    imageAlt: composeVehicleAlt(vehicle),
    imageSrc: normalizeLocalhostImageUrl(vehicle.imageUrl),
    year: vehicle.year,
    mileage: vehicle.mileage,
  };
}
