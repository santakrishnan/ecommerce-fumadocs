// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { InventoryCard } from "../../agent-search-turns-collection";
import type { BaseMappedInventoryCard } from "../../base-agent-types";
import { mapBaseCardToResultItem } from "../map-base-card-to-result-item";
import { mapInventoryCardToInventoryCard } from "../map-inventory-card-to-inventory-card";

/**
 * End-to-end badge mapping tests — feed representative agent card shapes through
 * the real mappers and assert the badge the UI would render. Badges are derived
 * from `computed.comparisonAxes.keyFeatures` (see lib/vehicle-badges).
 */

const KEY_FEATURES = [
  { key: "comfort.moonroof", label: "Moonroof", category: "General", isStandard: true, msrp: 0 },
  {
    key: "safety.adaptive_cruise_control",
    label: "Adaptive Cruise",
    category: "General",
    isStandard: true,
    msrp: 0,
  },
];

function buildBaseInventoryCard(vehicle: Record<string, unknown>): BaseMappedInventoryCard {
  return {
    type: "inventory",
    id: (vehicle.vin as string) ?? "TESTVIN",
    image: undefined,
    subtitle: undefined,
    title: "Test Vehicle",
    nextSearchPlan: {} as BaseMappedInventoryCard["nextSearchPlan"],
    data: { vehicle },
  };
}

describe("mapBaseCardToResultItem — inventory badge", () => {
  it("maps the top keyFeature to the card badge (Sunroof)", () => {
    const item = mapBaseCardToResultItem(
      buildBaseInventoryCard({
        vin: "3TMLB5JN9TM280338",
        vehicleInfo: { year: 2026, make: "Toyota", model: "Tacoma", trim: "TRD Sport" },
        pricing: { listPrice: 56_157 },
        status: { mileage: 3 },
        computed: { comparisonAxes: { keyFeatures: KEY_FEATURES } },
      })
    );

    expect(item.type).toBe("inventory");
    if (item.type === "inventory") {
      expect(item.data.badge).toEqual({ iconName: "toyota-x", label: "Sunroof" });
    }
  });

  it("returns no badge when there are no qualifying keyFeatures", () => {
    const item = mapBaseCardToResultItem(
      buildBaseInventoryCard({
        vin: "TESTVIN456",
        vehicleInfo: { year: 2026, make: "Toyota", model: "Tacoma", trim: "SR5" },
        pricing: { listPrice: 40_124 },
        status: { mileage: 5 },
        computed: { comparisonAxes: { keyFeatures: [] } },
      })
    );

    if (item.type === "inventory") {
      expect(item.data.badge).toBeUndefined();
    }
  });
});

describe("mapInventoryCardToInventoryCard — inventory badge (v2 shape)", () => {
  const baseCard: InventoryCard = {
    vin: "TESTVIN789",
    dealerInfo: { dealerCode: "T1", dealerName: "Test Toyota", zipCode: "90001" },
    pricing: { listPrice: 30_000 },
    status: { mileage: 40_000 },
    vehicleInfo: { year: 2020, make: "Toyota", model: "Camry", trim: "SE" },
  };

  it("maps status.isCertified to the 'Certified' badge when no higher signal exists", () => {
    const vehicle = mapInventoryCardToInventoryCard({
      ...baseCard,
      status: { mileage: 40_000, isCertified: true },
    });

    expect(vehicle.badge).toEqual({ iconName: "toyota-x", label: "Certified" });
  });

  it("leads with a runtime keyFeature over certification", () => {
    const vehicle = mapInventoryCardToInventoryCard({
      ...baseCard,
      status: { mileage: 40_000, isCertified: true },
      ...({
        computed: { comparisonAxes: { keyFeatures: KEY_FEATURES } },
      } as object),
    });

    expect(vehicle.badge).toEqual({ iconName: "toyota-x", label: "Sunroof" });
  });
});
