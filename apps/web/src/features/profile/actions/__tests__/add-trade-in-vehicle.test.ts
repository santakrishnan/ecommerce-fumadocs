import { TRADE_IN_VEHICLE_COUNT_COOKIE } from "@config/trade-in-vehicle-count";
import { TRADE_IN_VEHICLES_FIXTURE } from "@features/profile/bff/__fixtures__/trade-in.fixture";
import { TRADE_IN_VEHICLE_DATA_COOKIE } from "@features/profile/lib/trade-in-cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const { mockCookies, mockDelete, mockGet, mockRandomUUID, mockSet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockDelete: vi.fn(),
  mockGet: vi.fn(),
  mockRandomUUID: vi.fn(),
  mockSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

const [firstVehicle, secondVehicle] = TRADE_IN_VEHICLES_FIXTURE;

if (!(firstVehicle && secondVehicle)) {
  throw new Error("The trade-in fixture must contain two vehicles for these tests.");
}

const storedCookies = new Map<string, string>();

function getStoredCookie(name: string): string {
  const value = storedCookies.get(name);
  if (value === undefined) {
    throw new Error(`Expected cookie ${name} to be set.`);
  }
  return value;
}

beforeEach(() => {
  vi.resetModules();
  storedCookies.clear();
  mockCookies.mockReset();
  mockDelete.mockReset();
  mockGet.mockReset();
  mockRandomUUID.mockReset();
  mockSet.mockReset();
  mockCookies.mockResolvedValue({ delete: mockDelete, get: mockGet, set: mockSet });
  mockGet.mockImplementation((name: string) => {
    const value = storedCookies.get(name);
    return value === undefined ? undefined : { value };
  });
  mockSet.mockImplementation((name: string, value: string) => {
    storedCookies.set(name, value);
  });
  mockDelete.mockImplementation((name: string) => {
    storedCookies.delete(name);
  });
  vi.stubGlobal("crypto", { randomUUID: mockRandomUUID });
});

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("addTradeInVehicleAction", () => {
  it("persists the submitted fields with a fresh id and preserves the baseline cookie", async () => {
    storedCookies.set(TRADE_IN_VEHICLE_COUNT_COOKIE, "1");
    mockRandomUUID.mockReturnValue("stored-vehicle-1");

    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    const result = await addTradeInVehicleAction(firstVehicle);

    expect(result).toEqual({ success: true });
    expect(JSON.parse(getStoredCookie(TRADE_IN_VEHICLE_DATA_COOKIE))).toEqual([
      { ...firstVehicle, id: "stored-vehicle-1" },
    ]);
    expect(storedCookies.get(TRADE_IN_VEHICLE_COUNT_COOKIE)).toBe("1");
    expect(mockSet).toHaveBeenCalledWith(TRADE_IN_VEHICLE_DATA_COOKIE, expect.any(String), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
    expect(mockDelete).not.toHaveBeenCalledWith(TRADE_IN_VEHICLE_COUNT_COOKIE);
  });

  it("appends a second addition after the first without removing it", async () => {
    mockRandomUUID.mockReturnValueOnce("stored-vehicle-1").mockReturnValueOnce("stored-vehicle-2");

    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    await addTradeInVehicleAction(firstVehicle);
    await addTradeInVehicleAction(secondVehicle);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(JSON.parse(getStoredCookie(TRADE_IN_VEHICLE_DATA_COOKIE))).toEqual([
      { ...firstVehicle, id: "stored-vehicle-1" },
      { ...secondVehicle, id: "stored-vehicle-2" },
    ]);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("preserves duplicate additions of the same vehicle as distinct ordered entries", async () => {
    mockRandomUUID.mockReturnValueOnce("stored-vehicle-1").mockReturnValueOnce("stored-vehicle-2");

    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    await addTradeInVehicleAction(firstVehicle);
    await addTradeInVehicleAction(firstVehicle);

    expect(JSON.parse(getStoredCookie(TRADE_IN_VEHICLE_DATA_COOKIE))).toEqual([
      { ...firstVehicle, id: "stored-vehicle-1" },
      { ...firstVehicle, id: "stored-vehicle-2" },
    ]);
  });

  it("appends to a legacy single-object cookie without losing the existing entry", async () => {
    storedCookies.set(TRADE_IN_VEHICLE_DATA_COOKIE, JSON.stringify(firstVehicle));
    mockRandomUUID.mockReturnValue("stored-vehicle-2");

    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    await addTradeInVehicleAction(secondVehicle);

    expect(JSON.parse(getStoredCookie(TRADE_IN_VEHICLE_DATA_COOKIE))).toEqual([
      firstVehicle,
      { ...secondVehicle, id: "stored-vehicle-2" },
    ]);
  });

  it("does not persist an invalid vehicle payload", async () => {
    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    const result = await addTradeInVehicleAction({
      ...firstVehicle,
      estimatedValue: Number.NaN,
    });

    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockCookies).not.toHaveBeenCalled();
  });

  it("fails atomically without mutating state when the serialized collection exceeds the byte budget", async () => {
    const oversizedTitle = "x".repeat(4000);
    storedCookies.set(
      TRADE_IN_VEHICLE_DATA_COOKIE,
      JSON.stringify([{ ...firstVehicle, title: oversizedTitle }])
    );
    mockRandomUUID.mockReturnValue("stored-vehicle-2");

    const { addTradeInVehicleAction } = await import("../add-trade-in-vehicle");
    const result = await addTradeInVehicleAction(secondVehicle);

    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
    expect(JSON.parse(getStoredCookie(TRADE_IN_VEHICLE_DATA_COOKIE))).toEqual([
      { ...firstVehicle, title: oversizedTitle },
    ]);
  });
});
