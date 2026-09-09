// @vitest-environment node
import { parseMetricValue } from "../lib/parse-metric-value";

describe("parseMetricValue", () => {
  it("splits numeric value from unit suffix", () => {
    expect(parseMetricValue("84.3 cu. ft.")).toEqual({ value: "84.3", unit: "cu. ft." });
  });

  it("handles integer with short unit", () => {
    expect(parseMetricValue("615 mi")).toEqual({ value: "615", unit: "mi" });
  });

  it("handles unit with parentheses", () => {
    expect(parseMetricValue("30 min (80%)")).toEqual({ value: "30", unit: "min (80%)" });
  });

  it("returns undefined unit for plain number", () => {
    expect(parseMetricValue("35")).toEqual({ value: "35", unit: undefined });
  });

  it("keeps leading currency symbol as part of value", () => {
    expect(parseMetricValue("$45,000")).toEqual({ value: "$45,000", unit: undefined });
  });

  it("handles number with commas and unit", () => {
    expect(parseMetricValue("1,200 lbs")).toEqual({ value: "1,200", unit: "lbs" });
  });

  it("handles decimal without leading digit", () => {
    expect(parseMetricValue(".5 gal")).toEqual({ value: ".5", unit: "gal" });
  });

  it("returns raw string as value when no numeric match", () => {
    expect(parseMetricValue("Hybrid")).toEqual({ value: "Hybrid", unit: undefined });
  });
});
