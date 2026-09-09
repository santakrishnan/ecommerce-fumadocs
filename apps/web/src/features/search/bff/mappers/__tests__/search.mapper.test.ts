// @vitest-environment node
import { describe, expect, it } from "vitest";
import { baseInventoryCardResponse } from "../../__fixtures__/inventory-card-response.fixture";
import { mapInventoryCardResponseToVehicle } from "../search.mapper";

describe("mapInventoryCardResponseToVehicle", () => {
  it("maps all standard fields from a full InventoryCardResponse", () => {
    const vehicle = mapInventoryCardResponseToVehicle(baseInventoryCardResponse);

    expect(vehicle.id).toBe("1HGBH41JXMN109186");
    expect(vehicle.vin).toBe("1HGBH41JXMN109186");
    expect(vehicle.make).toBe("Toyota");
    expect(vehicle.model).toBe("Highlander");
    expect(vehicle.year).toBe(2024);
    expect(vehicle.trim).toBe("XLE");
    expect(vehicle.price).toBe(42_000);
    expect(vehicle.originalPrice).toBe(44_500);
    expect(vehicle.mileage).toBe(12_500);
    expect(vehicle.imageUrl).toBe("https://cdn.example.com/photos/abc.jpg");
    expect(vehicle.aiDescription).toBe("Spacious hybrid SUV with excellent fuel economy.");
  });

  it("builds the canonical VDP href from a valid ISO 3779 VIN", () => {
    const vehicle = mapInventoryCardResponseToVehicle(baseInventoryCardResponse);

    expect(vehicle.href).toBe("/used-cars/details/toyota/highlander/xle/2024/1HGBH41JXMN109186");
  });

  it("returns href undefined when VIN is not a valid ISO 3779 VIN", () => {
    const vehicle = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      vin: "invalid-vin",
    });

    expect(vehicle.href).toBeUndefined();
  });

  it("falls back to the default placeholder image when no photos are present", () => {
    const vehicle = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      media: undefined,
    });

    // With no upstream photo and resolveVehicleImage disabled, the mapper
    // falls back to the normalizeImageUrl default placeholder.
    expect(vehicle.imageUrl).toBe("/inventory-card/default.png");
  });

  it("normalises a localhost photo URL to a root-relative path", () => {
    const vehicle = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      media: {
        photos: [{ url: "http://localhost:3000/images/vehicle.jpg", displayOrder: 1 }],
      },
    });

    expect(vehicle.imageUrl).toBe("/images/vehicle.jpg");
  });

  it("maps description to aiDescription and leaves it undefined when absent", () => {
    const withDescription = mapInventoryCardResponseToVehicle(baseInventoryCardResponse);
    expect(withDescription.aiDescription).toBe("Spacious hybrid SUV with excellent fuel economy.");

    const withoutDescription = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      description: undefined,
    });
    expect(withoutDescription.aiDescription).toBeUndefined();
  });

  it("leaves originalPrice undefined when msrp is absent", () => {
    const vehicle = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      pricing: { listPrice: 42_000 },
    });

    expect(vehicle.originalPrice).toBeUndefined();
  });

  it("does not set FE-only fields (badge, surface) — this mapper feeds landing too", () => {
    const vehicle = mapInventoryCardResponseToVehicle({
      ...baseInventoryCardResponse,
      computed: {
        comparisonAxes: {
          keyFeatures: [
            {
              key: "comfort.moonroof",
              label: "Moonroof",
              category: "General",
              isStandard: true,
              msrp: 0,
            },
          ],
        },
      },
    } as never);

    // Badges are search-only and derived by the search-page mapper
    // (map-sdk-inventory-card-to-vehicle), not this shared landing mapper.
    expect(vehicle.badge).toBeUndefined();
    expect(vehicle.surface).toBeUndefined();
  });
});
