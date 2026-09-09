// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FILTERS_SUCCESS_FIXTURE } from "../../__fixtures__/filters.fixture";
import type { SmartFilter } from "../../contracts/filters-response.schema";
import { mapFiltersToUI } from "../filters-to-ui.mapper";

/** Helper to safely access a section from the mapped result. */
function getSection(result: ReturnType<typeof mapFiltersToUI>, key: string) {
  return result[key as keyof typeof result];
}

describe("mapFiltersToUI", () => {
  it("maps the full FILTERS_SUCCESS_FIXTURE without throwing", () => {
    const result = mapFiltersToUI(FILTERS_SUCCESS_FIXTURE.data.filters);
    expect(result).toBeDefined();
  });

  it("maps a Range filter (price) to rangeFields with input type", () => {
    const filters: SmartFilter[] = [
      { key: "price", label: "Price", type: "Range", min: 8500, max: 89_900 },
    ];

    const result = mapFiltersToUI(filters);
    const price = getSection(result, "price");

    expect(price).toBeDefined();
    expect(price?.rangeFields).toEqual([
      { label: "Min", value: "$9K" },
      { label: "Max", value: "$90K" },
    ]);
    expect(price?.rangeType).toBe("input");
  });

  it("maps a Range filter (year) to rangeFields with select type", () => {
    const filters: SmartFilter[] = [
      { key: "year", label: "Year", type: "Range", min: 2018, max: 2025 },
    ];

    const result = mapFiltersToUI(filters);
    const year = getSection(result, "year");

    expect(year).toBeDefined();
    expect(year?.rangeFields).toEqual([
      { label: "From", value: "2018" },
      { label: "To", value: "2025" },
    ]);
    expect(year?.rangeType).toBe("select");
  });

  it("maps a Range filter (mileage) to rangeFields with formatted values", () => {
    const filters: SmartFilter[] = [
      { key: "mileage", label: "Mileage", type: "Range", min: 0, max: 148_000 },
    ];

    const result = mapFiltersToUI(filters);
    const mileage = getSection(result, "mileage");

    expect(mileage).toBeDefined();
    expect(mileage?.rangeFields).toEqual([
      { label: "Min", value: "0 mi" },
      { label: "Max", value: "148K mi" },
    ]);
  });

  it("maps a MultiEnum filter (drivetrain) to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "drivetrain",
        label: "Drivetrain",
        type: "MultiEnum",
        options: [
          { value: "Front Wheel Drive", count: 487 },
          { value: "All Wheel Drive", count: 612 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const drivetrain = getSection(result, "drivetrain");

    expect(drivetrain).toBeDefined();
    expect(drivetrain?.quickFilters).toEqual([
      { label: "Front Wheel Drive", value: "Front Wheel Drive" },
      { label: "All Wheel Drive", value: "All Wheel Drive" },
    ]);
  });

  it("maps exteriorColorFamily to colorGroups with hex metadata", () => {
    const filters: SmartFilter[] = [
      {
        key: "exteriorColorFamily",
        label: "Exterior Color",
        type: "MultiEnum",
        options: [
          { value: "White", count: 312, metadata: { hex: "#F2F0EB" } },
          { value: "Black", count: 287, metadata: { hex: "#1C1C1C" } },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const color = getSection(result, "color");

    expect(color).toBeDefined();
    expect(color?.colorGroups).toHaveLength(1);
    expect(color?.colorGroups?.[0]?.label).toBe("Exterior");
    expect(color?.colorGroups?.[0]?.colors).toEqual([
      { label: "White", value: "White", hex: "#F2F0EB" },
      { label: "Black", value: "Black", hex: "#1C1C1C" },
    ]);
  });

  it("merges exterior and interior colors into the same color section", () => {
    const filters: SmartFilter[] = [
      {
        key: "exteriorColorFamily",
        label: "Exterior Color",
        type: "MultiEnum",
        options: [{ value: "White", count: 312, metadata: { hex: "#F2F0EB" } }],
      },
      {
        key: "interiorColorFamily",
        label: "Interior Color",
        type: "MultiEnum",
        options: [{ value: "Black", count: 876, metadata: { hex: "#1C1C1C" } }],
      },
    ];

    const result = mapFiltersToUI(filters);
    const color = getSection(result, "color");

    expect(color?.colorGroups).toHaveLength(2);
    expect(color?.colorGroups?.[0]?.label).toBe("Exterior");
    expect(color?.colorGroups?.[1]?.label).toBe("Interior");
  });

  it("maps transmissionType to the transmission UI key", () => {
    const filters: SmartFilter[] = [
      {
        key: "transmissionType",
        label: "Transmission",
        type: "MultiEnum",
        options: [
          { value: "Automatic", count: 1234 },
          { value: "CVT", count: 187 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const transmission = getSection(result, "transmission");

    expect(transmission).toBeDefined();
    expect(transmission?.quickFilters).toEqual([
      { label: "Automatic", value: "Automatic" },
      { label: "CVT", value: "CVT" },
    ]);
  });

  it("uses the label field from options when present", () => {
    const filters: SmartFilter[] = [
      {
        key: "fuelType",
        label: "Fuel Type",
        type: "MultiEnum",
        options: [{ value: "PHEV", label: "Plug-in Hybrid (PHEV)", count: 98 }],
      },
    ];

    const result = mapFiltersToUI(filters);
    const fuelType = getSection(result, "fuel-type");

    expect(fuelType?.quickFilters?.[0]?.label).toBe("Plug-in Hybrid (PHEV)");
  });

  it("maps model filter to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "model",
        label: "Model",
        type: "MultiEnum",
        options: [
          { value: "Camry", label: "Camry", count: 68 },
          { value: "Corolla", label: "Corolla", count: 45 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const model = getSection(result, "model");

    expect(model).toBeDefined();
    expect(model?.quickFilters).toEqual([
      { label: "Camry", value: "Camry" },
      { label: "Corolla", value: "Corolla" },
    ]);
  });

  it("maps features filter to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "features",
        label: "Features",
        type: "MultiEnum",
        options: [
          { value: "Leather", label: "Leather", count: 234 },
          { value: "Sunroof", label: "Sunroof", count: 156 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const features = getSection(result, "features");

    expect(features).toBeDefined();
    expect(features?.quickFilters).toEqual([
      { label: "Leather", value: "Leather" },
      { label: "Sunroof", value: "Sunroof" },
    ]);
  });

  it("skips filters with unmapped keys (dealRating only)", () => {
    const filters: SmartFilter[] = [
      {
        key: "dealRating",
        label: "Deal Rating",
        type: "MultiEnum",
        options: [{ value: "Great Deal", count: 287 }],
      },
    ];

    const result = mapFiltersToUI(filters);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("maps bodyStyle filter to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "bodyStyle",
        label: "Body Style",
        type: "MultiEnum",
        options: [
          { value: "Sedan", label: "Sedan", count: 445 },
          { value: "SUV", label: "SUV", count: 623 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const bodyStyle = getSection(result, "body-style");

    expect(bodyStyle).toBeDefined();
    expect(bodyStyle?.quickFilters).toEqual([
      { label: "Sedan", value: "Sedan" },
      { label: "SUV", value: "SUV" },
    ]);
  });

  it("maps make filter to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "make",
        label: "Make",
        type: "MultiEnum",
        options: [
          { value: "Toyota", label: "Toyota", count: 892 },
          { value: "Honda", label: "Honda", count: 756 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const make = getSection(result, "make");

    expect(make).toBeDefined();
    expect(make?.quickFilters).toEqual([
      { label: "Toyota", value: "Toyota" },
      { label: "Honda", value: "Honda" },
    ]);
  });

  it("maps trim filter to quickFilters", () => {
    const filters: SmartFilter[] = [
      {
        key: "trim",
        label: "Trim",
        type: "MultiEnum",
        options: [
          { value: "XLE", label: "XLE", count: 334 },
          { value: "LE", label: "LE", count: 298 },
        ],
      },
    ];

    const result = mapFiltersToUI(filters);
    const trim = getSection(result, "trim");

    expect(trim).toBeDefined();
    expect(trim?.quickFilters).toEqual([
      { label: "XLE", value: "XLE" },
      { label: "LE", value: "LE" },
    ]);
  });

  it("returns an empty object for an empty filters array", () => {
    const result = mapFiltersToUI([]);
    expect(result).toEqual({});
  });

  it("handles Range filter with undefined min/max gracefully", () => {
    const filters: SmartFilter[] = [{ key: "price", label: "Price", type: "Range" }];

    const result = mapFiltersToUI(filters);
    const price = getSection(result, "price");

    expect(price?.rangeFields).toEqual([
      { label: "Min", value: "$0" },
      { label: "Max", value: "Any" },
    ]);
  });
});
