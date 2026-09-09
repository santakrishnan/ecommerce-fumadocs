// @vitest-environment node
/// <reference types="@testing-library/jest-dom" />

import type { Vehicle } from "@shared/components/inventory-card";
import { describe, expect, it } from "vitest";
import {
  type ActiveVehicleFilter,
  filterVehiclesByActiveFilters,
} from "../bff/services/search-results-service";

const createMockVehicles = (): Vehicle[] => [
  {
    id: "v-1",
    make: "Toyota",
    model: "Highlander",
    year: 2025,
    trim: "Hybrid XLE",
    price: 28_000,
    mileage: 5000,
    imageUrl: "/inventory-card/inventory-card1.png",
  },
  {
    id: "v-2",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid LE",
    price: 35_000,
    mileage: 15_000,
    imageUrl: "/inventory-card/inventory-card2.png",
  },
  {
    id: "v-3",
    make: "Toyota",
    model: "Highlander",
    year: 2023,
    trim: "Hybrid Limited",
    price: 42_000,
    mileage: 25_000,
    imageUrl: "/inventory-card/inventory-card3.png",
  },
  {
    id: "v-4",
    make: "Toyota",
    model: "4Runner",
    year: 2024,
    trim: "Standard",
    price: 50_000,
    mileage: 8000,
    imageUrl: "/inventory-card/inventory-card4.png",
  },
];

describe("filterVehiclesByActiveFilters", () => {
  describe("price filtering", () => {
    it("filters by max price with priceMax key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "priceMax", value: "35000" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.id)).toEqual(["v-1", "v-2"]);
      expect(result.every((v) => v.price <= 35_000)).toBe(true);
    });

    it("filters by max price with price key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "$40000" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.every((v) => v.price <= 40_000)).toBe(true);
    });

    it("filters by combined min and max price range", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "$30K-$45K" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.id)).toEqual(["v-2", "v-3"]);
      expect(result.every((v) => v.price >= 30_000 && v.price <= 45_000)).toBe(true);
    });

    it("filters by min-only price range", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "$35K-" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(3);
      expect(result.map((v) => v.id)).toEqual(["v-2", "v-3", "v-4"]);
      expect(result.every((v) => v.price >= 35_000)).toBe(true);
    });

    it("returns all vehicles when price filter value is invalid", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "invalid" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(vehicles.length);
    });
  });

  describe("mileage filtering", () => {
    it("filters by max mileage with mileageMax key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "mileageMax", value: "15000" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(3);
      expect(result.every((v) => v.mileage <= 15_000)).toBe(true);
    });

    it("filters by max mileage with mileage key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "mileage", value: "10000" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.id)).toEqual(["v-1", "v-4"]);
    });

    it("returns all vehicles when mileage filter value is invalid", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "mileage", value: "abc" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(vehicles.length);
    });
  });

  describe("year filtering", () => {
    it("filters by min year with yearFrom key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "yearFrom", value: "2024" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(3);
      expect(result.every((v) => v.year >= 2024)).toBe(true);
      expect(result.map((v) => v.id)).toEqual(["v-1", "v-2", "v-4"]);
    });

    it("filters by min year with year key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "year", value: "2023" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(4);
      expect(result.every((v) => v.year >= 2023)).toBe(true);
    });

    it("filters by combined min and max year range", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "year", value: "2024-2024" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.id)).toEqual(["v-2", "v-4"]);
      expect(result.every((v) => v.year >= 2024 && v.year <= 2024)).toBe(true);
    });

    it("returns all vehicles when year filter value is invalid", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "year", value: "not_a_year" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(vehicles.length);
    });
  });

  describe("model filtering", () => {
    it("filters by model with models key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "models", value: "Highlander" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(3);
      expect(result.map((v) => v.id)).toEqual(["v-1", "v-2", "v-3"]);
      expect(result.every((v) => v.model === "Highlander")).toBe(true);
    });

    it("filters by model with model key", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "model", value: "4Runner" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("v-4");
    });

    it("filters by model case-insensitively", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "model", value: "highlander" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(3);
    });

    it("returns empty array when model does not match", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "model", value: "Camry" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(0);
    });
  });

  describe("multiple filters", () => {
    it("applies multiple filters in sequence", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [
        { key: "priceMax", value: "45000" },
        { key: "yearFrom", value: "2024" },
      ];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.id)).toEqual(["v-1", "v-2"]);
      expect(result.every((v) => v.price <= 45_000 && v.year >= 2024)).toBe(true);
    });

    it("applies price, mileage, and year filters together", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [
        { key: "price", value: "36000" },
        { key: "mileage", value: "10000" },
        { key: "year", value: "2024" },
      ];

      const result = filterVehiclesByActiveFilters(vehicles, filters);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("v-1");
    });

    it("applies filters and reduces result set as filters are added", () => {
      const vehicles = createMockVehicles();

      const noFilters = filterVehiclesByActiveFilters(vehicles, []);
      expect(noFilters).toHaveLength(4);

      const withPrice = filterVehiclesByActiveFilters(vehicles, [{ key: "price", value: "40000" }]);
      expect(withPrice).toHaveLength(2);
      expect(withPrice.length).toBeLessThan(noFilters.length);

      const withPriceAndYear = filterVehiclesByActiveFilters(vehicles, [
        { key: "price", value: "40000" },
        { key: "year", value: "2025" },
      ]);
      expect(withPriceAndYear).toHaveLength(1);
      expect(withPriceAndYear.length).toBeLessThan(withPrice.length);
    });
  });

  describe("edge cases", () => {
    it("returns empty array when filters eliminate all vehicles", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "1000" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(0);
    });

    it("returns all vehicles when no filters are provided", () => {
      const vehicles = createMockVehicles();

      const result = filterVehiclesByActiveFilters(vehicles, []);

      expect(result).toHaveLength(vehicles.length);
    });

    it("returns all vehicles when filter key is unknown", () => {
      const vehicles = createMockVehicles();
      const filters: ActiveVehicleFilter[] = [{ key: "unknownFilterType", value: "someValue" }];

      const result = filterVehiclesByActiveFilters(vehicles, filters);

      expect(result).toHaveLength(vehicles.length);
    });

    it("does not mutate the original vehicles array", () => {
      const vehicles = createMockVehicles();
      const vehiclesCopy = [...vehicles];
      const filters: ActiveVehicleFilter[] = [{ key: "price", value: "30000" }];

      filterVehiclesByActiveFilters(vehicles, filters);

      expect(vehicles).toEqual(vehiclesCopy);
    });
  });

  describe("URL parameter synchronization with plain keys", () => {
    it("converts activeFilters to plain key URL params (not prefixed)", () => {
      const activeFilters = [
        { key: "price", value: "40000" },
        { key: "mileage", value: "20000" },
        { key: "year", value: "2024" },
      ];

      const urlParams = new URLSearchParams();
      for (const filter of activeFilters) {
        urlParams.append(filter.key, filter.value);
      }

      expect(urlParams.get("price")).toBe("40000");
      expect(urlParams.get("mileage")).toBe("20000");
      expect(urlParams.get("year")).toBe("2024");
      expect(urlParams.get("filter.price")).toBeNull();
    });

    it("preserves filter keys when round-tripping through URL", () => {
      const originalFilters = [
        { key: "priceMax", value: "50000" },
        { key: "mileageMax", value: "25000" },
        { key: "yearFrom", value: "2023" },
        { key: "models", value: "Highlander" },
      ];

      const urlParams = new URLSearchParams();
      for (const filter of originalFilters) {
        urlParams.append(filter.key, filter.value);
      }

      const restoredFilters = Array.from(urlParams.entries()).map(([key, value]) => ({
        key,
        value,
      }));

      expect(restoredFilters).toEqual(originalFilters);
    });

    it("encodes and decodes special characters in filter values", () => {
      const urlParams = new URLSearchParams();
      urlParams.append("models", "Grand Highlander");
      urlParams.append("price", "40,000");

      expect(urlParams.get("models")).toBe("Grand Highlander");
      expect(urlParams.get("price")).toBe("40,000");
      expect(urlParams.toString()).toContain("models=Grand+Highlander&price=40%2C000");
    });

    it("produces empty URL string when no filters are applied", () => {
      const urlParams = new URLSearchParams();
      expect(urlParams.toString()).toBe("");
    });
  });
});
