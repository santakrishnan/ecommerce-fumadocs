// @vitest-environment node
import type { Vehicle } from "@shared/components/inventory-card";
import type { SmartFilter } from "@ucmp/sdk-search-api";
import { sortOrderEnum } from "@ucmp/sdk-search-api";
import { describe, expect, it } from "vitest";
import { searchFiltersToActiveVehicleFilters, sortVehicles } from "../search-results-service";

function makeVehicle(input: { id: string; price: number; mileage: number; year: number }): Vehicle {
  return {
    id: input.id,
    make: "Toyota",
    model: "Highlander",
    year: input.year,
    trim: "Hybrid",
    price: input.price,
    mileage: input.mileage,
    imageUrl: "/inventory-card/inventory-card1.png",
  };
}

describe("sortVehicles", () => {
  const vehicles: Vehicle[] = [
    makeVehicle({ id: "v-1", price: 45_000, mileage: 12_000, year: 2023 }),
    makeVehicle({ id: "v-2", price: 39_000, mileage: 20_000, year: 2024 }),
    makeVehicle({ id: "v-3", price: 52_000, mileage: 8000, year: 2022 }),
  ];

  it("returns original order for Recommended", () => {
    const sorted = sortVehicles(vehicles, sortOrderEnum.Recommended);

    expect(sorted).toBe(vehicles);
    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["v-1", "v-2", "v-3"]);
  });

  it("sorts by LowestPrice", () => {
    const sorted = sortVehicles(vehicles, sortOrderEnum.LowestPrice);

    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["v-2", "v-1", "v-3"]);
    expect(vehicles.map((vehicle) => vehicle.id)).toEqual(["v-1", "v-2", "v-3"]);
  });

  it("sorts by HighestPrice", () => {
    const sorted = sortVehicles(vehicles, sortOrderEnum.HighestPrice);

    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["v-3", "v-1", "v-2"]);
  });

  it("sorts by LowestMileage", () => {
    const sorted = sortVehicles(vehicles, sortOrderEnum.LowestMileage);

    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["v-3", "v-1", "v-2"]);
  });

  it("sorts by NewestYear", () => {
    const sorted = sortVehicles(vehicles, sortOrderEnum.NewestYear);

    expect(sorted.map((vehicle) => vehicle.id)).toEqual(["v-2", "v-1", "v-3"]);
  });
});

describe("searchFiltersToActiveVehicleFilters", () => {
  it("maps enum and multi-enum BFF filters back to active vehicle filters", () => {
    const filters: SmartFilter[] = [
      {
        key: "drivetrain",
        label: "Drivetrain",
        type: "Enum",
        options: [{ count: 12, label: "AWD", value: "awd" }],
      },
      {
        key: "fuelType",
        label: "Fuel Type",
        type: "MultiEnum",
        options: [
          { count: 8, label: "Hybrid", value: "hybrid" },
          { count: 5, label: "Plug-in Hybrid", value: "phev" },
        ],
      },
    ];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([
      { key: "drivetrain", value: "awd" },
      { key: "fuel-type", value: "hybrid" },
      { key: "fuel-type", value: "phev" },
    ]);
  });

  it("maps a range with both bounds back to a combined value", () => {
    const filters: SmartFilter[] = [
      { key: "price", label: "Price", type: "Range", min: 15_000, max: 45_000 },
    ];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([
      { key: "price", value: "15000-45000" },
    ]);
  });

  it("maps min-only ranges back to a single active filter value", () => {
    const filters: SmartFilter[] = [{ key: "year", label: "Year", type: "Range", min: 2023 }];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([{ key: "year", value: "2023" }]);
  });

  it("maps max-only ranges back to a single active filter value", () => {
    const filters: SmartFilter[] = [
      { key: "mileage", label: "Mileage", type: "Range", max: 45_000 },
    ];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([
      { key: "mileage", value: "45000" },
    ]);
  });

  it("skips range filters that have neither min nor max", () => {
    const filters: SmartFilter[] = [{ key: "price", label: "Price", type: "Range" }];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([]);
  });

  it("skips BFF filters that do not map to active vehicle keys", () => {
    const filters: SmartFilter[] = [
      {
        key: "make",
        label: "Make",
        type: "Enum",
        options: [{ count: 20, label: "Toyota", value: "toyota" }],
      },
    ];

    expect(searchFiltersToActiveVehicleFilters(filters)).toEqual([]);
  });
});
