// @vitest-environment node
/**
 * Vehicle context header formatting — verifies the whitespace normalization
 * applied to the "Toyota {model} {trim}" heading in the VDP overlay.
 */

import { formatVehicleHeading } from "../lib/format-vehicle-heading";

describe("Vehicle Context Header Formatting", () => {
  it("produces clean heading with model and trim", () => {
    expect(formatVehicleHeading("Highlander", "Hybrid Limited")).toBe(
      "Toyota Highlander Hybrid Limited"
    );
  });

  it("handles empty trim without trailing space", () => {
    expect(formatVehicleHeading("Camry", "")).toBe("Toyota Camry");
  });

  it("collapses multiple spaces in model or trim", () => {
    expect(formatVehicleHeading("RAV4  Hybrid", "XLE  Premium")).toBe(
      "Toyota RAV4 Hybrid XLE Premium"
    );
  });

  it("trims leading/trailing whitespace in trim", () => {
    expect(formatVehicleHeading("Highlander", "  Limited  ")).toBe("Toyota Highlander Limited");
  });
});
