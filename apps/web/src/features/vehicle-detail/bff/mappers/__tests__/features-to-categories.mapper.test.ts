// @vitest-environment node
import type { VehicleFeatures } from "@ucmp/sdk-search-api";
import {
  mapVehicleFeaturesToCategories,
  mapVehicleFeaturesToKeyList,
} from "../features-to-categories.mapper";

describe("mapVehicleFeaturesToCategories", () => {
  it("maps byCategory array to correct Category[] shape", () => {
    const features: VehicleFeatures = {
      byCategory: [
        {
          category: "SAFETY",
          items: [
            { id: "1", name: "Airbags" },
            { id: "2", name: "ABS" },
          ],
          label: "Safety Features",
        },
        {
          category: "COMFORT & CONVENIENCE",
          items: [{ id: "3", name: "Heated Seats" }],
          label: "Comfort & Convenience",
        },
      ],
      ids: ["1", "2", "3"],
      text: "",
    };

    const result = mapVehicleFeaturesToCategories(features);

    expect(result).toEqual([
      {
        id: "safety",
        items: [{ label: "Airbags" }, { label: "ABS" }],
        title: "Safety Features",
      },
      {
        id: "comfort-convenience",
        items: [{ label: "Heated Seats" }],
        title: "Comfort & Convenience",
      },
    ]);
  });

  it("returns empty array when byCategory is empty", () => {
    const features: VehicleFeatures = {
      byCategory: [],
      ids: [],
      text: "",
    };

    expect(mapVehicleFeaturesToCategories(features)).toEqual([]);
  });
});

describe("mapVehicleFeaturesToKeyList", () => {
  it("returns flat name list from byCategory items", () => {
    const features: VehicleFeatures = {
      byCategory: [
        {
          category: "SAFETY",
          items: [
            { id: "1", name: "Airbags" },
            { id: "2", name: "ABS" },
          ],
          label: "Safety Features",
        },
        {
          category: "TECH",
          items: [{ id: "3", name: "Navigation" }],
          label: "Technology",
        },
      ],
      ids: ["1", "2", "3"],
      text: "",
    };

    expect(mapVehicleFeaturesToKeyList(features)).toEqual(["Airbags", "ABS", "Navigation"]);
  });

  it("falls back to splitting text when byCategory is empty", () => {
    const features: VehicleFeatures = {
      byCategory: [],
      ids: [],
      text: "Airbags, ABS\nNavigation",
    };

    expect(mapVehicleFeaturesToKeyList(features)).toEqual(["Airbags", "ABS", "Navigation"]);
  });

  it("returns empty array when both byCategory and text are empty", () => {
    const features: VehicleFeatures = {
      byCategory: [],
      ids: [],
      text: "",
    };

    expect(mapVehicleFeaturesToKeyList(features)).toEqual([]);
  });
});
