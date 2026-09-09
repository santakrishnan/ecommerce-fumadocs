// @vitest-environment node
import type { VehicleWarranty } from "@ucmp/sdk-search-api";
import { formatWarrantyValue } from "../warranty.mapper";

describe("formatWarrantyValue", () => {
  it("returns powertrain when present", () => {
    const warranty: VehicleWarranty = {
      basic: "3 years / 36,000 miles",
      powertrain: "5 years / 60,000 miles",
    };

    expect(formatWarrantyValue(warranty)).toBe("5 years / 60,000 miles");
  });

  it("falls back to basic when powertrain is absent", () => {
    const warranty: VehicleWarranty = {
      basic: "3 years / 36,000 miles",
      powertrain: "",
    };

    expect(formatWarrantyValue(warranty)).toBe("3 years / 36,000 miles");
  });

  it('returns "Warranty included" when both are empty', () => {
    const warranty: VehicleWarranty = {
      basic: "",
      powertrain: "",
    };

    expect(formatWarrantyValue(warranty)).toBe("Warranty included");
  });
});
