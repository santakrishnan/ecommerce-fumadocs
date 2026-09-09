// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FILTER_MOCK_DATA } from "../components/filters-dialog/filter-mock-data";

describe("FILTER_MOCK_DATA", () => {
  describe("price", () => {
    it("has Min and Max range fields with input type", () => {
      const { rangeType, rangeFields } = FILTER_MOCK_DATA.price;
      expect(rangeType).toBe("input");
      expect(rangeFields).toHaveLength(2);
      expect(rangeFields?.[0].label).toBe("Min");
      expect(rangeFields?.[1].label).toBe("Max");
    });

    it("has 5 quick-select chips", () => {
      expect(FILTER_MOCK_DATA.price.quickFilters).toHaveLength(5);
    });
  });

  describe("year", () => {
    it("has From and To range fields with select type", () => {
      const { rangeType, rangeFields } = FILTER_MOCK_DATA.year;
      expect(rangeType).toBe("select");
      expect(rangeFields?.[0].label).toBe("From");
      expect(rangeFields?.[1].label).toBe("To");
    });

    it("has 4 quick-select chips", () => {
      expect(FILTER_MOCK_DATA.year.quickFilters).toHaveLength(4);
    });
  });

  describe("mileage", () => {
    it("has Min and Max range fields with correct max value", () => {
      const { rangeType, rangeFields } = FILTER_MOCK_DATA.mileage;
      expect(rangeType).toBe("input");
      expect(rangeFields?.[0].label).toBe("Min");
      expect(rangeFields?.[1].label).toBe("Max");
      expect(rangeFields?.[1].value).toBe("50K miles");
    });

    it("has 5 quick-select chips", () => {
      expect(FILTER_MOCK_DATA.mileage.quickFilters).toHaveLength(5);
    });
  });

  describe("model", () => {
    it("has 8 body-type tabs", () => {
      expect(FILTER_MOCK_DATA.model.modelTabs).toHaveLength(8);
    });

    it("first tab is Sedan", () => {
      expect(FILTER_MOCK_DATA.model.modelTabs?.[0]?.label).toBe("Sedan");
    });
  });

  describe("color", () => {
    it("has Exterior and Interior groups", () => {
      const { colorGroups } = FILTER_MOCK_DATA.color;
      expect(colorGroups).toHaveLength(2);
      expect(colorGroups?.[0]?.label).toBe("Exterior");
      expect(colorGroups?.[1]?.label).toBe("Interior");
    });

    it("exterior colors have exact spec hex values", () => {
      const exterior = FILTER_MOCK_DATA.color.colorGroups?.[0]?.colors ?? [];
      const black = exterior.find((c) => c.label === "Black");
      const blue = exterior.find((c) => c.label === "Blue");
      expect(black?.hex).toBe("#1a1a1a");
      expect(blue?.hex).toBe("#3366cc");
    });

    it("Other color has no hex", () => {
      const exterior = FILTER_MOCK_DATA.color.colorGroups?.[0]?.colors ?? [];
      const other = exterior.find((c) => c.label === "Other");
      expect(other?.hex).toBeUndefined();
    });

    it("interior colors have exact spec hex values", () => {
      const interior = FILTER_MOCK_DATA.color.colorGroups?.[1]?.colors ?? [];
      const beige = interior.find((c) => c.label === "Beige");
      const ivory = interior.find((c) => c.label === "Ivory");
      expect(beige?.hex).toBe("#C8AD7F");
      expect(ivory?.hex).toBe("#FFFDD0");
    });
  });

  describe("fuel-type", () => {
    it("has 6 options: Gas, Diesel, Hybrid, PHEV, Electric, Flex Fuel", () => {
      const labels = FILTER_MOCK_DATA["fuel-type"].quickFilters?.map((f) => f.label);
      expect(labels).toEqual([
        "Gas",
        "Diesel",
        "Hybrid",
        "Plug-in Hybrid (PHEV)",
        "Electric",
        "Flex Fuel",
      ]);
    });
  });

  describe("drivetrain", () => {
    it("has 4 options: AWD, FWD, RWD, 4WD", () => {
      const labels = FILTER_MOCK_DATA.drivetrain.quickFilters?.map((f) => f.label);
      expect(labels).toEqual(["AWD", "FWD", "RWD", "4WD"]);
    });
  });

  describe("inspection", () => {
    it("has one radio option: 160-Point Inspection with subtitle", () => {
      const { radioOptions } = FILTER_MOCK_DATA.inspection;
      expect(radioOptions).toHaveLength(1);
      expect(radioOptions?.[0]?.label).toBe("160-Point Inspection");
      expect(radioOptions?.[0]?.description).toBe("Factory-trained technician verified");
    });
  });

  describe("features", () => {
    it("has 6 category tabs", () => {
      expect(FILTER_MOCK_DATA.features.featureTabs).toHaveLength(6);
    });

    it("first tab is Comfort with 16 pills", () => {
      const comfort = FILTER_MOCK_DATA.features.featureTabs?.[0];
      expect(comfort?.label).toBe("Comfort");
      expect(comfort?.models).toHaveLength(16);
    });
  });

  describe("transmission", () => {
    it("has 3 options: Automatic, CVT, Manual", () => {
      const labels = FILTER_MOCK_DATA.transmission.quickFilters?.map((f) => f.label);
      expect(labels).toEqual(["Automatic", "CVT", "Manual"]);
    });
  });
});
