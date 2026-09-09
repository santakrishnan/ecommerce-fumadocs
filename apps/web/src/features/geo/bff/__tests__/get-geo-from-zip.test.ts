// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NYC_UPSTREAM_RESPONSE, wrapInEnvelope } from "../__fixtures__/from-zip-upstream.fixture";
import { mapFromZipUpstreamToResponse } from "../mappers/from-zip.mapper";
import { mockGeoFromZip } from "../services/geo-from-zip-mock";

// Mock next/cache (not available in jsdom)
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getGeoFromZip use case", () => {
  describe("mock mode (USE_GEO_MOCKS=true, no upstream)", () => {
    it("returns known zip data for 10001", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_GEO_MOCKS", "true");
      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");

      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.city).toBe("New York");
        expect(result.data.zip).toBe("10001");
      }
    });

    it("returns known zip data for 90210", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_GEO_MOCKS", "true");
      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");

      const result = await getGeoFromZip({ zip: "90210" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.city).toBe("Beverly Hills");
        expect(result.data.stateCode).toBe("CA");
      }
    });

    it("returns region-based fallback for unknown zip", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_GEO_MOCKS", "true");
      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");

      const result = await getGeoFromZip({ zip: "77042" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stateCode).toBe("TX");
      }
    });
  });

  describe("fail-fast mode (no upstream, mocks disabled)", () => {
    it("returns 503 when neither upstream nor mocks are configured", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_GEO_MOCKS", "false");
      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");

      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(503);
      }
    });

    it("returns 503 when USE_GEO_MOCKS is set to something other than 'true'", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "");
      vi.stubEnv("USE_GEO_MOCKS", "false");
      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");

      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(503);
      }
    });
  });

  describe("upstream mode", () => {
    it("calls upstream /fromZip/{zip} and maps the response", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(wrapInEnvelope(NYC_UPSTREAM_RESPONSE)), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );

      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");
      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.city).toBe("New York");
        expect(result.data.zip).toBe("10001");
        expect(result.data.latitude).toBe(40.7484);
      }
    });

    it("passes zip as path param to upstream", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify(wrapInEnvelope(NYC_UPSTREAM_RESPONSE)), { status: 200 })
        );

      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");
      await getGeoFromZip({ zip: "60601" });

      const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
      expect(calledUrl).toContain("/fromZip/60601");
    });

    it("returns structured error when upstream is unreachable", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");
      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(502);
      }
    });

    it("returns error when upstream returns invalid response shape", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ unexpected: "data" }), { status: 200 })
      );

      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");
      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_ERROR");
      }
    });

    it("returns 503 when API_UPSTREAM_URL is set but GEO_API_KEY is missing", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");

      const { getGeoFromZip } = await import("../use-cases/get-geo-from-zip");
      const result = await getGeoFromZip({ zip: "10001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(503);
      }
    });
  });
});

describe("mockGeoFromZip service", () => {
  it("returns known zip data", async () => {
    const result = await mockGeoFromZip({ zip: "60601" });
    expect(result.city).toBe("Chicago");
    expect(result.stateCode).toBe("IL");
  });

  it("returns region default for unknown zip starting with 9", async () => {
    const result = await mockGeoFromZip({ zip: "94102" });
    expect(result.stateCode).toBe("CA");
  });

  it("returns region default for unknown zip starting with 1", async () => {
    const result = await mockGeoFromZip({ zip: "12345" });
    expect(result.city).toBe("New York");
  });
});

describe("mapFromZipUpstreamToResponse", () => {
  it("maps upstream shape to frontend shape", () => {
    const result = mapFromZipUpstreamToResponse(NYC_UPSTREAM_RESPONSE);

    expect(result).toEqual({
      city: "New York",
      state: "New York",
      stateCode: "NY",
      zip: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
    });
  });
});
