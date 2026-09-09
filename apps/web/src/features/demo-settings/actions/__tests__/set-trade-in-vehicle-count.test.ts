import {
  TRADE_IN_VEHICLE_COUNT_COOKIE,
  TRADE_IN_VEHICLE_COUNT_OPTIONS,
} from "@config/trade-in-vehicle-count";
import { TRADE_IN_VEHICLE_DATA_COOKIE } from "@features/profile/lib/trade-in-cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const { mockCookies, mockDelete, mockSet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockDelete: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

const selectedOption = TRADE_IN_VEHICLE_COUNT_OPTIONS[1];

if (!selectedOption) {
  throw new Error("The demo settings must contain a one-vehicle option for these tests.");
}

const storedCookies = new Map<string, string>();

beforeEach(() => {
  vi.resetModules();
  storedCookies.clear();
  storedCookies.set(TRADE_IN_VEHICLE_COUNT_COOKIE, "3");
  storedCookies.set(TRADE_IN_VEHICLE_DATA_COOKIE, "stale-vehicle");
  mockCookies.mockReset();
  mockDelete.mockReset();
  mockSet.mockReset();
  mockCookies.mockResolvedValue({ set: mockSet, delete: mockDelete });
  mockSet.mockImplementation((name: string, value: string) => {
    storedCookies.set(name, value);
  });
  mockDelete.mockImplementation((name: string) => {
    storedCookies.delete(name);
  });
});

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("setTradeInVehicleCount", () => {
  it("sets the selected count and clears the tracked added vehicle", async () => {
    const { setTradeInVehicleCount } = await import("../set-trade-in-vehicle-count");
    const result = await setTradeInVehicleCount(selectedOption.value);

    expect(result).toEqual({ success: true });
    expect(storedCookies.get(TRADE_IN_VEHICLE_COUNT_COOKIE)).toBe(selectedOption.value);
    expect(storedCookies.has(TRADE_IN_VEHICLE_DATA_COOKIE)).toBe(false);
    expect(mockSet).toHaveBeenCalledWith(TRADE_IN_VEHICLE_COUNT_COOKIE, selectedOption.value, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
    expect(mockDelete).toHaveBeenCalledWith(TRADE_IN_VEHICLE_DATA_COOKIE);
  });

  it("does not mutate either cookie for an invalid count", async () => {
    const { setTradeInVehicleCount } = await import("../set-trade-in-vehicle-count");
    const result = await setTradeInVehicleCount("4");

    expect(result).toEqual({ success: false });
    expect(storedCookies.get(TRADE_IN_VEHICLE_COUNT_COOKIE)).toBe("3");
    expect(storedCookies.get(TRADE_IN_VEHICLE_DATA_COOKIE)).toBe("stale-vehicle");
    expect(mockCookies).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("resetTradeInVehicleCount", () => {
  it("deletes both the count and added vehicle cookies", async () => {
    const { resetTradeInVehicleCount } = await import("../set-trade-in-vehicle-count");
    const result = await resetTradeInVehicleCount();

    expect(result).toEqual({ success: true });
    expect(storedCookies.size).toBe(0);
    expect(mockDelete).toHaveBeenNthCalledWith(1, TRADE_IN_VEHICLE_COUNT_COOKIE);
    expect(mockDelete).toHaveBeenNthCalledWith(2, TRADE_IN_VEHICLE_DATA_COOKIE);
  });
});
