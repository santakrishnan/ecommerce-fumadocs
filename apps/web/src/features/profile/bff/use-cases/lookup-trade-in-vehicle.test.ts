// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lookupTradeInVehicle", () => {
  it("returns fixture data when USE_TRADE_IN_LOOKUP_MOCKS is true", async () => {
    vi.stubEnv("USE_TRADE_IN_LOOKUP_MOCKS", "true");

    const { lookupTradeInVehicle } = await import("./lookup-trade-in-vehicle");
    const result = await lookupTradeInVehicle("XYZ5678", "NY");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("MAZDA CX-5 2.5 S AWD");
      expect(result.data.licensePlate).toBe("XYZ5678");
    }
  });

  it("returns 503 when neither mocks nor upstream are configured", async () => {
    vi.stubEnv("USE_TRADE_IN_LOOKUP_MOCKS", "false");

    const { lookupTradeInVehicle } = await import("./lookup-trade-in-vehicle");
    const result = await lookupTradeInVehicle("ABC1234", "CA");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
      expect(result.error.status).toBe(503);
    }
  });

  it("calls upstream when API_UPSTREAM_URL is set and mocks are off", async () => {
    vi.stubEnv("USE_TRADE_IN_LOOKUP_MOCKS", "false");
    vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");

    const { lookupTradeInVehicle } = await import("./lookup-trade-in-vehicle");
    const result = await lookupTradeInVehicle("ABC1234", "CA");

    // Upstream stub returns 503
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
    }
  });
});
