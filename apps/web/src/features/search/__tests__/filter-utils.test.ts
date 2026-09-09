// @vitest-environment node
import { describe, expect, it } from "vitest";

import { FILTER_MOCK_DATA } from "../components/filters-dialog/filter-mock-data";
import { getRangeValuesFromActiveFilters } from "../components/filters-dialog/filter-utils";

const priceRangeFields = FILTER_MOCK_DATA.price.rangeFields;

const mileageRangeFields = FILTER_MOCK_DATA.mileage.rangeFields;

const yearRangeFields = FILTER_MOCK_DATA.year.rangeFields;

describe("getRangeValuesFromActiveFilters", () => {
  it("returns the default price values when no active price filter is set", () => {
    const result = getRangeValuesFromActiveFilters(priceRangeFields, "price", []);

    expect(result).toEqual({ Min: "$0", Max: "$35K" });
  });

  it("hydrates the max field from a preset price filter", () => {
    const result = getRangeValuesFromActiveFilters(priceRangeFields, "price", [
      { key: "price", label: "$20k or less", value: "20000" },
    ]);

    expect(result).toEqual({ Min: "$0", Max: "$20K" });
  });

  it("hydrates both min and max fields from an active typed price range", () => {
    const result = getRangeValuesFromActiveFilters(priceRangeFields, "price", [
      { key: "price", label: "$10K-$45K", value: "$10K-$45K" },
    ]);

    expect(result).toEqual({ Min: "$10K", Max: "$45K" });
  });

  it("preserves the default max value when only a minimum price is active", () => {
    const result = getRangeValuesFromActiveFilters(priceRangeFields, "price", [
      { key: "price", label: "$15K+", value: "$15K-" },
    ]);

    expect(result).toEqual({ Min: "$15K", Max: "$35K" });
  });

  it("hydrates the max field from a preset mileage filter", () => {
    const result = getRangeValuesFromActiveFilters(mileageRangeFields, "mileage", [
      { key: "mileage", label: "Under 15K mi", value: "15000" },
    ]);

    expect(result).toEqual({ Min: "0 mi", Max: "15K" });
  });

  it("hydrates both min and max fields from an active typed mileage range", () => {
    const result = getRangeValuesFromActiveFilters(mileageRangeFields, "mileage", [
      { key: "mileage", label: "10K-45K", value: "10K-45K" },
    ]);

    expect(result).toEqual({ Min: "10K", Max: "45K" });
  });

  it("hydrates the from field from a preset year filter", () => {
    const result = getRangeValuesFromActiveFilters(yearRangeFields, "year", [
      { key: "year", label: "2023 or newer", value: "2023" },
    ]);

    expect(result).toEqual({ From: "2023", To: "Newest" });
  });

  it("hydrates both year dropdowns from an active year range", () => {
    const result = getRangeValuesFromActiveFilters(yearRangeFields, "year", [
      { key: "year", label: "2019-2021", value: "2019-2021" },
    ]);

    expect(result).toEqual({ From: "2019", To: "2021" });
  });
});
