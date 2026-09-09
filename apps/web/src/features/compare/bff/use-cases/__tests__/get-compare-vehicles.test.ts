import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCompareVehicles } from "../get-compare-vehicles";

describe("getCompareVehicles", () => {
  beforeEach(() => {
    vi.stubEnv("USE_COMPARE_MOCKS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns synthesized vehicles for the requested watchlist VINs in mock mode", async () => {
    const vins = ["4T1DAACK0SU158850", "3TMKB5FN8RM019070", "4T1G11AK6RU907810"];

    const result = await getCompareVehicles(vins);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.map((v) => v.vin)).toEqual(vins);
  });

  it("short-circuits to an empty list when no VINs are provided", async () => {
    const result = await getCompareVehicles([]);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data).toEqual([]);
  });
});
