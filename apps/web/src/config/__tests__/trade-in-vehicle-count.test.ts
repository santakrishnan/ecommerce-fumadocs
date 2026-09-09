import { describe, expect, it } from "vitest";

import {
  deriveTradeInVehicleCountFromTotal,
  resolveTradeInVehicleCount,
  TRADE_IN_VEHICLE_COUNT_OPTIONS,
} from "../trade-in-vehicle-count";

describe("TRADE_IN_VEHICLE_COUNT_OPTIONS", () => {
  it('labels the "3" option as "3+ vehicles"', () => {
    const option = TRADE_IN_VEHICLE_COUNT_OPTIONS.find((entry) => entry.value === "3");

    expect(option?.title).toBe("3+ vehicles (View all modal)");
  });
});

describe("resolveTradeInVehicleCount", () => {
  it("falls back to the default when the raw value is invalid or absent", () => {
    expect(resolveTradeInVehicleCount(undefined)).toBe("3");
    expect(resolveTradeInVehicleCount("not-a-count")).toBe("3");
  });

  it("passes through a valid raw value", () => {
    expect(resolveTradeInVehicleCount("1")).toBe("1");
  });
});

describe("deriveTradeInVehicleCountFromTotal", () => {
  it.each([
    [0, "0"],
    [-1, "0"],
    [1, "1"],
    [2, "2"],
  ])("maps a total of %d to %s", (total, expected) => {
    expect(deriveTradeInVehicleCountFromTotal(total)).toBe(expected);
  });

  it.each([3, 4, 5, 10])('maps a total of %d to "3" (3+)', (total) => {
    expect(deriveTradeInVehicleCountFromTotal(total)).toBe("3");
  });
});
