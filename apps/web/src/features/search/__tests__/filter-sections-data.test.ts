// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FILTER_SECTIONS } from "../components/filters-dialog/filter-sections-data";

describe("FILTER_SECTIONS", () => {
  it("contains exactly 12 sections", () => {
    expect(FILTER_SECTIONS).toHaveLength(12);
  });

  it("sections are in the required order", () => {
    const keys = FILTER_SECTIONS.map((s) => s.key);
    expect(keys).toEqual([
      "price",
      "year",
      "mileage",
      "make",
      "model",
      "trim",
      "body-style",
      "color",
      "fuel-type",
      "drivetrain",
      "features",
      "transmission",
    ]);
  });

  it("each section has a matching id of the form 'filter-{key}'", () => {
    for (const section of FILTER_SECTIONS) {
      expect(section.id).toBe(`filter-${section.key}`);
    }
  });

  it("each section has a non-empty label", () => {
    for (const section of FILTER_SECTIONS) {
      expect(section.label.length).toBeGreaterThan(0);
    }
  });
});
