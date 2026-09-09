// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { SelectedContextFilter } from "../bff/contracts/filters-response.schema";
import {
  activeFiltersToSmartFilters,
  contextFiltersToActiveFilters,
  contextFiltersToSmartFilters,
} from "../lib/filter-converters";

// ─── contextFiltersToSmartFilters ─────────────────────────────────────────────

describe("contextFiltersToSmartFilters", () => {
  it("converts a values[] filter to an Enum SmartFilter", () => {
    const filters: SelectedContextFilter[] = [{ key: "bodyStyle", values: ["SUV", "Truck"] }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      {
        key: "bodyStyle",
        label: "bodyStyle",
        options: [
          { count: 0, value: "SUV" },
          { count: 0, value: "Truck" },
        ],
        type: "Enum",
      },
    ]);
  });

  it("converts a features filter to MultiEnum", () => {
    const filters: SelectedContextFilter[] = [
      { key: "features", values: ["heated_seats", "sunroof"] },
    ];

    const result = contextFiltersToSmartFilters(filters);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: "features", type: "MultiEnum" });
  });

  it("converts a single string value to an Enum SmartFilter", () => {
    const filters: SelectedContextFilter[] = [{ key: "make", value: "Toyota" }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      {
        key: "make",
        label: "make",
        options: [{ count: 0, value: "Toyota" }],
        type: "Enum",
      },
    ]);
  });

  it("converts a min+max range filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "price", max: 50_000, min: 20_000 }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      { key: "price", label: "price", max: 50_000, min: 20_000, type: "Range" },
    ]);
  });

  it("converts a min-only range filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "year", min: 2022 }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      { key: "year", label: "year", min: 2022, type: "Range" },
    ]);
  });

  it("converts a max-only range filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "mileage", max: 30_000 }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      { key: "mileage", label: "mileage", max: 30_000, type: "Range" },
    ]);
  });

  it("converts a boolean filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "dealRating", value: true }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([
      { count: 0, key: "dealRating", label: "dealRating", type: "Boolean" },
    ]);
  });

  it("drops filters with unrecognised keys", () => {
    // Cast needed: real data from cookie may have arbitrary keys at runtime
    const filters = [{ key: "unknownKey", values: ["foo"] }] as unknown as SelectedContextFilter[];

    expect(contextFiltersToSmartFilters(filters)).toEqual([]);
  });

  it("drops filters that produce no values (empty values array, no value, no range)", () => {
    const filters: SelectedContextFilter[] = [{ key: "make", values: [] }];

    expect(contextFiltersToSmartFilters(filters)).toEqual([]);
  });

  it("handles an empty array", () => {
    expect(contextFiltersToSmartFilters([])).toEqual([]);
  });

  it("converts multiple filters in order", () => {
    const filters: SelectedContextFilter[] = [
      { key: "make", values: ["Toyota"] },
      { key: "bodyStyle", values: ["SUV"] },
    ];

    const result = contextFiltersToSmartFilters(filters);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: "make" });
    expect(result[1]).toMatchObject({ key: "bodyStyle" });
  });
});

// ─── contextFiltersToActiveFilters ───────────────────────────────────────────

describe("contextFiltersToActiveFilters", () => {
  it("produces one pill per value in a values[] filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "bodyStyle", values: ["SUV", "Truck"] }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "bodyStyle", label: "SUV", value: "SUV" },
      { key: "bodyStyle", label: "Truck", value: "Truck" },
    ]);
  });

  it("produces one pill for a single value filter", () => {
    const filters: SelectedContextFilter[] = [{ key: "make", value: "Toyota" }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "make", label: "Toyota", value: "Toyota" },
    ]);
  });

  it("formats a price min+max range as a human-readable pill", () => {
    const filters: SelectedContextFilter[] = [{ key: "price", max: 50_000, min: 20_000 }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "price", label: "Price: $20K–$50K", value: "20000-50000" },
    ]);
  });

  it("formats a price min-only range", () => {
    const filters: SelectedContextFilter[] = [{ key: "price", min: 30_000 }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "price", label: "Price: $30K+", value: "30000-" },
    ]);
  });

  it("formats a price max-only range", () => {
    const filters: SelectedContextFilter[] = [{ key: "price", max: 40_000 }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "price", label: "Price: up to $40K", value: "-40000" },
    ]);
  });

  it("formats a mileage range with the K mi suffix", () => {
    const filters: SelectedContextFilter[] = [{ key: "mileage", max: 30_000 }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "mileage", label: "Mileage: up to 30K mi", value: "-30000" },
    ]);
  });

  it("formats a year range with plain numbers (no special formatting)", () => {
    const filters: SelectedContextFilter[] = [{ key: "year", max: 2024, min: 2020 }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "year", label: "Year: 2020–2024", value: "2020-2024" },
    ]);
  });

  it("produces no pill for a filter with no value, values, or range", () => {
    const filters: SelectedContextFilter[] = [{ key: "make" }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([]);
  });

  it("handles an empty array", () => {
    expect(contextFiltersToActiveFilters([])).toEqual([]);
  });

  it("flattens multiple filters", () => {
    const filters: SelectedContextFilter[] = [
      { key: "make", values: ["Toyota"] },
      { key: "price", max: 50_000, min: 20_000 },
    ];

    const result = contextFiltersToActiveFilters(filters);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: "make", label: "Toyota" });
    expect(result[1]).toMatchObject({ key: "price", label: "Price: $20K–$50K" });
  });

  it("maps exteriorColorFamily BFF key to ext-color UI key", () => {
    const filters: SelectedContextFilter[] = [{ key: "exteriorColorFamily", values: ["Black"] }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "ext-color", label: "Black", value: "Black" },
    ]);
  });

  it("maps interiorColorFamily BFF key to int-color UI key", () => {
    const filters: SelectedContextFilter[] = [{ key: "interiorColorFamily", values: ["Gray"] }];

    expect(contextFiltersToActiveFilters(filters)).toEqual([
      { key: "int-color", label: "Gray", value: "Gray" },
    ]);
  });

  it("uses ASCII hyphen in range value for round-trip compatibility", () => {
    const filters: SelectedContextFilter[] = [{ key: "price", max: 50_000, min: 20_000 }];
    const result = contextFiltersToActiveFilters(filters);

    expect(result[0]?.value).toBe("20000-50000");
    expect(result[0]?.value).not.toContain("–");
  });
});

// ─── activeFiltersToSmartFilters ─────────────────────────────────────────────

describe("activeFiltersToSmartFilters", () => {
  it("maps enum and multi-enum filters to the BFF request shape", () => {
    const result = activeFiltersToSmartFilters([
      { key: "drivetrain", label: "AWD", value: "awd" },
      { key: "features", label: "Blind Spot Monitor", value: "blind-spot-monitor" },
    ]);

    expect(result).toEqual([
      {
        key: "drivetrain",
        label: "AWD",
        options: [{ count: 1, label: "AWD", value: "awd" }],
        type: "Enum",
      },
      {
        key: "features",
        label: "Blind Spot Monitor",
        options: [{ count: 1, label: "Blind Spot Monitor", value: "blind-spot-monitor" }],
        type: "MultiEnum",
      },
    ]);
  });

  it("maps single numeric price filters to a max-only range", () => {
    const result = activeFiltersToSmartFilters([
      { key: "price", label: "$35K or less", value: "35000" },
    ]);

    expect(result).toEqual([{ key: "price", label: "$35K or less", max: 35_000, type: "Range" }]);
  });

  it("maps single numeric year filters to a min-only range", () => {
    const result = activeFiltersToSmartFilters([
      { key: "year", label: "2023 or newer", value: "2023" },
    ]);

    expect(result).toEqual([{ key: "year", label: "2023 or newer", min: 2023, type: "Range" }]);
  });

  it("maps min-only price ranges", () => {
    const result = activeFiltersToSmartFilters([
      { key: "price", label: "$35K and up", value: "$35K-" },
    ]);

    expect(result).toEqual([{ key: "price", label: "$35K and up", min: 35_000, type: "Range" }]);
  });

  it("maps max-only price ranges", () => {
    const result = activeFiltersToSmartFilters([
      { key: "price", label: "$45K or less", value: "-45K" },
    ]);

    expect(result).toEqual([{ key: "price", label: "$45K or less", max: 45_000, type: "Range" }]);
  });

  it("maps explicit price ranges with both min and max", () => {
    const result = activeFiltersToSmartFilters([
      { key: "price", label: "$15K-$45K", value: "$15K-$45K" },
    ]);

    expect(result).toEqual([
      { key: "price", label: "$15K-$45K", max: 45_000, min: 15_000, type: "Range" },
    ]);
  });

  it("maps the 'ext-color' UI key to the exteriorColorFamily SDK key", () => {
    const result = activeFiltersToSmartFilters([
      { key: "ext-color", label: "Blue", value: "blue" },
    ]);

    expect(result).toEqual([
      {
        key: "exteriorColorFamily",
        label: "Blue",
        options: [{ count: 1, label: "Blue", value: "blue" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'int-color' UI key to the interiorColorFamily SDK key", () => {
    const result = activeFiltersToSmartFilters([
      { key: "int-color", label: "Black", value: "black" },
    ]);

    expect(result).toEqual([
      {
        key: "interiorColorFamily",
        label: "Black",
        options: [{ count: 1, label: "Black", value: "black" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'fuel-type' UI key to the fuelType SDK key", () => {
    const result = activeFiltersToSmartFilters([
      { key: "fuel-type", label: "Hybrid", value: "Hybrid" },
    ]);

    expect(result).toEqual([
      {
        key: "fuelType",
        label: "Hybrid",
        options: [{ count: 1, label: "Hybrid", value: "Hybrid" }],
        type: "Enum",
      },
    ]);
  });

  it("skips filters that do not have a key mapping", () => {
    const result = activeFiltersToSmartFilters([
      { key: "unknown", label: "Unknown", value: "value" },
    ]);

    expect(result).toEqual([]);
  });

  it("maps the 'make' key to a make Enum filter", () => {
    const result = activeFiltersToSmartFilters([{ key: "make", label: "Toyota", value: "Toyota" }]);

    expect(result).toEqual([
      {
        key: "make",
        label: "Toyota",
        options: [{ count: 1, label: "Toyota", value: "Toyota" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'trim' key to a trim Enum filter", () => {
    const result = activeFiltersToSmartFilters([
      { key: "trim", label: "Limited", value: "Limited" },
    ]);

    expect(result).toEqual([
      {
        key: "trim",
        label: "Limited",
        options: [{ count: 1, label: "Limited", value: "Limited" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'bodyStyle' key to a bodyStyle Enum filter", () => {
    const result = activeFiltersToSmartFilters([{ key: "bodyStyle", label: "SUV", value: "SUV" }]);

    expect(result).toEqual([
      {
        key: "bodyStyle",
        label: "SUV",
        options: [{ count: 1, label: "SUV", value: "SUV" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'powertrainType' key to a powertrainType Enum filter", () => {
    const result = activeFiltersToSmartFilters([
      { key: "powertrainType", label: "Hybrid", value: "Hybrid" },
    ]);

    expect(result).toEqual([
      {
        key: "powertrainType",
        label: "Hybrid",
        options: [{ count: 1, label: "Hybrid", value: "Hybrid" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'vehicleCategory' key to a vehicleCategory Enum filter", () => {
    const result = activeFiltersToSmartFilters([
      { key: "vehicleCategory", label: "Luxury", value: "Luxury" },
    ]);

    expect(result).toEqual([
      {
        key: "vehicleCategory",
        label: "Luxury",
        options: [{ count: 1, label: "Luxury", value: "Luxury" }],
        type: "Enum",
      },
    ]);
  });

  it("maps the 'dealRating' key to a Boolean filter", () => {
    const result = activeFiltersToSmartFilters([
      { key: "dealRating", label: "Great Deal", value: "true" },
    ]);

    expect(result).toEqual([{ count: 0, key: "dealRating", label: "Great Deal", type: "Boolean" }]);
  });

  it("preserves all active filters through a round-trip from context seeding", () => {
    const seeded = contextFiltersToActiveFilters([
      { key: "make", values: ["Toyota"] },
      { key: "trim", values: ["Limited"] },
      { key: "bodyStyle", values: ["SUV"] },
    ]);

    const result = activeFiltersToSmartFilters(seeded);

    expect(result.map((f) => f.key)).toEqual(["make", "trim", "bodyStyle"]);
  });

  it("handles an empty array", () => {
    expect(activeFiltersToSmartFilters([])).toEqual([]);
  });
});
