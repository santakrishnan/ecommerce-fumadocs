// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function buildRequest(zip?: string | null): NextRequest {
  const url = new URL("http://localhost:3000/api/v1/geo/from-zip");
  if (zip !== undefined && zip !== null) {
    url.searchParams.set("zip", zip);
  }
  return new NextRequest(url);
}

describe("GET /api/v1/geo/from-zip", () => {
  describe("validation", () => {
    it("returns 400 for invalid zip (too short)", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("123"));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("GEO_VALIDATION_FAILED");
      expect(body.error.message).toBe("Invalid zip code");
    });

    it("returns 400 for invalid zip (letters)", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("abcde"));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("GEO_VALIDATION_FAILED");
    });

    it("returns 400 for invalid zip (too long)", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("123456"));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("GEO_VALIDATION_FAILED");
    });
  });

  describe("successful responses (mock mode)", () => {
    beforeEach(() => {
      vi.stubEnv("USE_GEO_MOCKS", "true");
    });

    it("returns 200 with location data for valid zip", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("10001"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        city: "New York",
        state: "New York",
        stateCode: "NY",
        zip: "10001",
        latitude: 40.7484,
        longitude: -73.9967,
      });
    });

    it("returns 400 when zip is missing", async () => {
      const { GET } = await import("../route");
      const request = new NextRequest(new URL("http://localhost:3000/api/v1/geo/from-zip"));
      const response = await GET(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("GEO_VALIDATION_FAILED");
    });

    it("returns 200 with region-based data for unknown zip", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("90001"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.stateCode).toBe("CA");
    });
  });

  describe("response shape", () => {
    beforeEach(() => {
      vi.stubEnv("USE_GEO_MOCKS", "true");
    });

    it("includes all expected fields", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("60601"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("city");
      expect(body).toHaveProperty("state");
      expect(body).toHaveProperty("stateCode");
      expect(body).toHaveProperty("zip");
      expect(body).toHaveProperty("latitude");
      expect(body).toHaveProperty("longitude");
    });

    it("error response has expected shape", async () => {
      const { GET } = await import("../route");
      const response = await GET(buildRequest("bad"));

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
    });
  });

  describe("upstream error forwarding", () => {
    it("returns upstream error status when upstream fails", async () => {
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
      vi.stubEnv("GEO_API_KEY", "test-geo-key");
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));

      const { GET } = await import("../route");
      const response = await GET(buildRequest("10001"));

      expect(response.status).toBe(502);
      const body = await response.json();
      expect(body.error.code).toBe("GEO_UPSTREAM_UNAVAILABLE");
    });
  });
});
