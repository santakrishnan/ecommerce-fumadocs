import { describe, expect, it } from "vitest";
import { mockFetchCompareVehicles } from "../compare-vehicles-mock";

describe("compare-vehicles-mock service", () => {
  it("synthesizes one CompareVehicle per requested VIN, preserving the VIN", async () => {
    const vins = ["4T1DAACK0SU158850", "3TMKB5FN8RM019070", "4T1G11AK6RU907810"];

    const result = await mockFetchCompareVehicles(vins);

    expect(result).toHaveLength(vins.length);
    expect(result.map((v) => v.vin)).toEqual(vins);
  });

  it("returns rich compare fields for each synthesized vehicle", async () => {
    const [vehicle] = await mockFetchCompareVehicles(["4T1DAACK0SU158850"]);

    expect(vehicle).toBeDefined();
    expect(vehicle?.pricing.sellingPrice).toBeGreaterThan(0);
    expect(vehicle?.make).toBe("Toyota");
    expect(vehicle?.safety.nhtsaOverallStars).toBeGreaterThan(0);
  });

  it("returns an empty array for no VINs", async () => {
    const result = await mockFetchCompareVehicles([]);
    expect(result).toEqual([]);
  });
});
