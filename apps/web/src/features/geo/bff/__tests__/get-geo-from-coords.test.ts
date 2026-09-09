// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NYC_UPSTREAM_RESPONSE, wrapInEnvelope } from "../__fixtures__/from-zip-upstream.fixture";
import { mockGeoFromCoords } from "../services/geo-from-coords-mock";

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

describe("getGeoFromCoords use case", () => {
  describe("mock mode (USE_GEO_MOCKS=true, no upstream)", () => {
    it("returns the northeast region for New York coordinates", async () => {
      vi.stubEnv("USE_GEO_MOCKS", "true");
      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");

      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stateCode).toBe("NY");
        expect(result.data.zip).toBe("10001");
      }
    });

    it("returns the pacific region for west-coast coordinates", async () => {
      vi.stubEnv("USE_GEO_MOCKS", "true");
      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");

      const result = await getGeoFromCoords({ latitude: 34.05, longitude: -118.24 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stateCode).toBe("CA");
      }
    });
  });

  describe("fail-fast mode (no upstream, mocks disabled)", () => {
    it("returns 503 when neither upstream nor mocks are configured", async () => {
      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");

      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(503);
      }
    });
  });

  describe("upstream mode", () => {
    it("calls upstream /fromCoords and maps the response", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(wrapInEnvelope(NYC_UPSTREAM_RESPONSE)), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );

      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");
      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.city).toBe("New York");
        expect(result.data.zip).toBe("10001");
      }
    });

    it("passes latitude and longitude as query params to upstream", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          new Response(JSON.stringify(wrapInEnvelope(NYC_UPSTREAM_RESPONSE)), { status: 200 })
        );

      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");
      await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
      expect(calledUrl).toContain("/fromCoords");
      expect(calledUrl).toContain("latitude=40.713");
      expect(calledUrl).toContain("longitude=-74.006");
    });

    it("returns structured error when upstream is unreachable", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");
      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

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

      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");
      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_ERROR");
      }
    });

    it("returns 503 when API_UPSTREAM_URL is set but GEO_API_KEY is missing", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");

      const { getGeoFromCoords } = await import("../use-cases/get-geo-from-coords");
      const result = await getGeoFromCoords({ latitude: 40.713, longitude: -74.006 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(503);
      }
    });
  });
});

describe("mockGeoFromCoords service", () => {
  it("buckets midwest-east longitudes to Chicago", async () => {
    // Bands are longitude-only: (-85, -75] → Chicago.
    const result = await mockGeoFromCoords({ latitude: 41.88, longitude: -80 });
    expect(result.city).toBe("Chicago");
    expect(result.stateCode).toBe("IL");
  });

  it("buckets mountain-west longitudes to Phoenix", async () => {
    const result = await mockGeoFromCoords({ latitude: 33.45, longitude: -112.07 });
    expect(result.stateCode).toBe("AZ");
  });

  it("defaults far-west longitudes to Los Angeles", async () => {
    const result = await mockGeoFromCoords({ latitude: 37.77, longitude: -122.42 });
    expect(result.stateCode).toBe("CA");
    expect(result.city).toBe("Los Angeles");
  });
});
