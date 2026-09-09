import type { Vehicle } from "@shared/components/inventory-card";
import type { InventoryCard } from "@ucmp/sdk-search-api";

/** Builds a deterministic 17-char VIN from a fixture vehicle id. */
function toDeterministicVin(id: string): string {
  const base = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `${base}${"0".repeat(17)}`.slice(0, 17);
}

/**
 * Maps a UI `Vehicle` fixture to the SDK `InventoryCard` wire shape.
 * Used by mock backends only.
 */
export function mapVehicleToInventoryCard(vehicle: Vehicle): InventoryCard {
  return {
    vin: toDeterministicVin(vehicle.id),
    vehicleInfo: {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
    },
    dealerInfo: {
      dealerCode: "MOCK-001",
      dealerName: "Mock Dealer",
    },
    pricing: {
      listPrice: vehicle.price,
      ...(vehicle.originalPrice === undefined ? {} : { msrp: vehicle.originalPrice }),
    },
    status: {
      mileage: vehicle.mileage,
      vehicleStatus: "Available",
    },
    media: {
      photos: [{ url: vehicle.imageUrl, displayOrder: 1 }],
    },
  };
}
