// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mock the shared utility so the route handler does not reach the CDN in tests.
// The mock is created before the route import so that the route's module-level
// import of fetchCarCutterManifest picks up the mock.
const mockFetchCarCutterManifest = vi.hoisted(() => vi.fn());
vi.mock("@features/vehicle-detail/lib/car-cutter", () => ({
  fetchCarCutterManifest: mockFetchCarCutterManifest,
}));

import { GET } from "../route";

const VALID_VIN = "4T1G11AK4PU151097";
const MINIMAL_MANIFEST = {
  categories: [],
  aspectRatio: "4:3",
  version: 3,
  imageHdWidth: 0,
  imageSubWidths: [],
};

function buildRequest() {
  return new Request(`http://localhost/api/v1/vehicles/${VALID_VIN}/360`, {
    method: "GET",
  }) as unknown as Parameters<typeof GET>[0];
}

function buildParams(vin: string) {
  return { params: Promise.resolve({ vin }) };
}

describe("GET /api/v1/vehicles/[vin]/360", () => {
  beforeEach(() => {
    // Default: manifest exists for the requested VIN
    mockFetchCarCutterManifest.mockResolvedValue(MINIMAL_MANIFEST);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── VIN validation ────────────────────────────────────────────────────────

  describe("VIN validation", () => {
    it("returns 400 for a VIN that is too short", async () => {
      const response = await GET(buildRequest(), buildParams("SHORT"));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN that is too long (18 chars)", async () => {
      const response = await GET(buildRequest(), buildParams("4T1G11AK4PU1510978"));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN containing the forbidden character I", async () => {
      const response = await GET(buildRequest(), buildParams("IT1G11AK4PU151097"));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN containing the forbidden character O", async () => {
      const response = await GET(buildRequest(), buildParams("OT1G11AK4PU151097"));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN containing the forbidden character Q", async () => {
      const response = await GET(buildRequest(), buildParams("QT1G11AK4PU151097"));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for an empty VIN", async () => {
      const response = await GET(buildRequest(), buildParams(""));
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("INVALID_VIN");
    });
  });

  // ─── VIN normalisation ───────────────────────────────────────────────────

  describe("VIN normalisation", () => {
    it("accepts a lowercase VIN and normalises to uppercase before fetching", async () => {
      const response = await GET(buildRequest(), buildParams("4t1g11ak4pu151097"));
      expect(response.status).toBe(200);
      // Utility was called with the normalised (uppercase) VIN
      expect(mockFetchCarCutterManifest).toHaveBeenCalledWith("4T1G11AK4PU151097");
    });
  });

  // ─── Manifest responses ──────────────────────────────────────────────────

  describe("manifest responses", () => {
    it("returns 200 with the manifest body when utility resolves", async () => {
      const manifest = { ...MINIMAL_MANIFEST, aspectRatio: "16:9" };
      mockFetchCarCutterManifest.mockResolvedValueOnce(manifest);

      const response = await GET(buildRequest(), buildParams(VALID_VIN));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.aspectRatio).toBe("16:9");
    });

    it("returns 404 when the utility returns null (CDN 404, CDN error, or hash not configured)", async () => {
      mockFetchCarCutterManifest.mockResolvedValueOnce(null);

      const response = await GET(buildRequest(), buildParams(VALID_VIN));
      expect(response.status).toBe(404);
      expect((await response.json()).error.code).toBe("NOT_FOUND");
    });
  });

  // ─── Error handling ──────────────────────────────────────────────────────

  describe("error handling", () => {
    it("returns 500 when the utility throws unexpectedly", async () => {
      mockFetchCarCutterManifest.mockRejectedValueOnce(new Error("Unexpected failure"));

      const response = await GET(buildRequest(), buildParams(VALID_VIN));
      expect(response.status).toBe(500);
      expect((await response.json()).error.code).toBe("INTERNAL_ERROR");
    });
  });
});
