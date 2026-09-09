import { TRADE_IN_VEHICLE_COUNT_COOKIE } from "@config/trade-in-vehicle-count";
import { TRADE_IN_VEHICLES_FIXTURE } from "@features/profile/bff/__fixtures__/trade-in.fixture";
import { TRADE_IN_VEHICLE_DATA_COOKIE } from "@features/profile/lib/trade-in-cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, mockFetchTradeInVehicles, mockGet, mockGetTradeInVehicles } = vi.hoisted(
  () => ({
    mockCookies: vi.fn(),
    mockFetchTradeInVehicles: vi.fn(),
    mockGet: vi.fn(),
    mockGetTradeInVehicles: vi.fn(),
  })
);

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("server-only", () => ({}));

vi.mock("../services/trade-in-mock", () => ({
  mockGetTradeInVehicles,
}));

vi.mock("../services/trade-in-upstream", () => ({
  fetchTradeInVehicles: mockFetchTradeInVehicles,
}));

const [fixtureVehicle] = TRADE_IN_VEHICLES_FIXTURE;

if (!fixtureVehicle) {
  throw new Error("The trade-in fixture must contain a vehicle for these tests.");
}

const addedVehicle = {
  ...fixtureVehicle,
  id: "added-vehicle-1",
  licensePlate: "ADDED123",
};

const secondAddedVehicle = {
  ...fixtureVehicle,
  id: "added-vehicle-2",
  licensePlate: "ADDED123",
};

function mockCookieValues(values: Record<string, string | undefined>) {
  mockGet.mockImplementation((name: string) => {
    const value = values[name];
    return value === undefined ? undefined : { value };
  });
}

beforeEach(() => {
  vi.resetModules();
  mockCookies.mockReset();
  mockFetchTradeInVehicles.mockReset();
  mockGet.mockReset();
  mockGetTradeInVehicles.mockReset();
  mockCookies.mockResolvedValue({ get: mockGet });
  vi.unstubAllEnvs();
  vi.stubEnv("USE_TRADE_IN_MOCKS", "false");
  vi.stubEnv("USE_TRADE_IN_LOOKUP_MOCKS", "false");
  vi.stubEnv("API_UPSTREAM_URL", "");
});

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("getTradeInVehicles", () => {
  it.each([
    ["0", 1],
    ["1", 2],
    ["2", 3],
    ["3", 4],
  ] as const)("appends the added vehicle to the %s-vehicle baseline", async (count, length) => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, Number(count));
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: count,
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify([addedVehicle]),
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({ success: true, data: [...baseline, addedVehicle] });
    if (result.success) {
      expect(result.data).toHaveLength(length);
    }
  });

  it("appends every manually added vehicle in insertion order, without deduplication", async () => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, 1);
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: "1",
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify([addedVehicle, secondAddedVehicle]),
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({
      success: true,
      data: [...baseline, addedVehicle, secondAddedVehicle],
    });
  });

  it("preserves duplicate lookup data as distinct entries with distinct ids", async () => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, 0);
    const duplicateVehicle = { ...addedVehicle, id: addedVehicle.id };
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: "0",
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify([addedVehicle, duplicateVehicle]),
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.id).toBe(addedVehicle.id);
      expect(result.data[1]?.id).not.toBe(addedVehicle.id);
    }
  });

  it("preserves the same baseline-plus-additions result across repeated reads", async () => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, 1);
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: "1",
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify([addedVehicle]),
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const firstResult = await getTradeInVehicles();
    const secondResult = await getTradeInVehicles();

    expect(secondResult).toEqual(firstResult);
    expect(mockGetTradeInVehicles).toHaveBeenCalledTimes(2);
  });

  it("assigns a stable unique id to a legacy added vehicle that collides with the baseline", async () => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, 1);
    const legacyAddedVehicle = { ...addedVehicle, id: fixtureVehicle.id };
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: "1",
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify(legacyAddedVehicle),
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const firstResult = await getTradeInVehicles();
    const secondResult = await getTradeInVehicles();

    expect(firstResult).toEqual({
      success: true,
      data: [...baseline, { ...legacyAddedVehicle, id: "trade-in-001-added" }],
    });
    expect(secondResult).toEqual(firstResult);
  });

  it("falls back to the baseline when the added vehicle cookie is malformed", async () => {
    const baseline = TRADE_IN_VEHICLES_FIXTURE.slice(0, 2);
    mockCookieValues({
      [TRADE_IN_VEHICLE_COUNT_COOKIE]: "2",
      [TRADE_IN_VEHICLE_DATA_COOKIE]: "{invalid-json",
    });
    mockGetTradeInVehicles.mockResolvedValue(baseline);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({ success: true, data: baseline });
  });

  it("uses the lookup mock flag as a mock-mode signal", async () => {
    vi.stubEnv("USE_TRADE_IN_LOOKUP_MOCKS", "true");
    mockCookieValues({});
    mockGetTradeInVehicles.mockResolvedValue(TRADE_IN_VEHICLES_FIXTURE);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({ success: true, data: TRADE_IN_VEHICLES_FIXTURE });
  });

  it("returns only the persisted collection when mocks are disabled", async () => {
    mockCookieValues({
      [TRADE_IN_VEHICLE_DATA_COOKIE]: JSON.stringify([addedVehicle, secondAddedVehicle]),
    });

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({ success: true, data: [addedVehicle, secondAddedVehicle] });
    expect(mockGetTradeInVehicles).not.toHaveBeenCalled();
  });

  it("calls upstream when mocks and persisted data are absent", async () => {
    const upstreamResult = { success: true, data: [fixtureVehicle] };
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    mockCookieValues({});
    mockFetchTradeInVehicles.mockResolvedValue(upstreamResult);

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual(upstreamResult);
    expect(mockFetchTradeInVehicles).toHaveBeenCalledWith("https://api.example.com");
  });

  it("returns 503 when mocks, persisted data, and upstream are absent", async () => {
    mockCookieValues({});

    const { getTradeInVehicles } = await import("./get-trade-in-vehicles");
    const result = await getTradeInVehicles();

    expect(result).toEqual({
      success: false,
      error: {
        code: "PROFILE_UPSTREAM_UNAVAILABLE",
        message: "API_UPSTREAM_URL is not configured and USE_TRADE_IN_MOCKS is not enabled",
        status: 503,
      },
    });
  });
});
