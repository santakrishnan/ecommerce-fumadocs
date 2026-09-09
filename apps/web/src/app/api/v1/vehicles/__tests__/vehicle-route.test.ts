// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@features/vehicle-detail/bff", async () => {
  const actual = await vi.importActual("@features/vehicle-detail/bff");
  return {
    ...actual,
    getVehicleDetail: vi.fn(),
    transformVdpToWelcomeBackShape: vi.fn(),
  };
});

import type { GetVehicleDetailResult } from "@features/vehicle-detail/bff";
import { getVehicleDetail, transformVdpToWelcomeBackShape } from "@features/vehicle-detail/bff";
import { GET } from "../[vin]/route";

const KNOWN_VIN = "JTERU5JR7N6123456";

/** Minimal VdpApiResponse stub — typed via cast for test purposes. */
const MOCK_VDP_SUCCESS = {
  success: true,
  data: {},
} as unknown as GetVehicleDetailResult;

/** Welcome Back shape returned by transformVdpToWelcomeBackShape. */
const MOCK_WELCOME_BACK_RESPONSE = {
  vin: KNOWN_VIN,
  vehicleInfo: {
    year: 2023,
    make: "Toyota",
    model: "4Runner",
    trim: "TRD Off Road",
    bodyStyle: undefined,
    drivetrain: undefined,
    fuelType: undefined,
    engine: undefined,
  },
  pricing: { listPrice: 29_900, msrp: 36_900, sellingPrice: 29_900 },
  status: { vehicleStatus: "In Stock", mileage: 36_435 },
  dealerInfo: {
    dealerCode: "5012",
    dealerName: "Bay Area Toyota",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
  },
  media: { photos: [], videos: [] },
};

/** Helper to build a minimal NextRequest with optional headers. */
function buildRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/vehicles/JTERU5JR7N6123456", {
    method: "GET",
    headers,
  }) as unknown as Parameters<typeof GET>[0];
}

/** Helper to build params as a Promise (Next.js 16 convention). */
function buildParams(vin: string) {
  return { params: Promise.resolve({ vin }) };
}

describe("GET /api/v1/vehicles/[vin]", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success path", () => {
    it("returns 200 with vehicle detail for a known VIN", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce(MOCK_VDP_SUCCESS);
      vi.mocked(transformVdpToWelcomeBackShape).mockReturnValueOnce(MOCK_WELCOME_BACK_RESPONSE);

      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.vin).toBe(KNOWN_VIN);
      expect(body.vehicleInfo).toBeDefined();
      expect(body.pricing).toBeDefined();
    });

    it("returns correct vehicle info fields", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce(MOCK_VDP_SUCCESS);
      vi.mocked(transformVdpToWelcomeBackShape).mockReturnValueOnce(MOCK_WELCOME_BACK_RESPONSE);

      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));
      const body = await response.json();

      expect(body.vehicleInfo).toMatchObject({
        year: 2023,
        make: "Toyota",
        model: "4Runner",
      });
    });

    it("normalizes VIN to uppercase", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce(MOCK_VDP_SUCCESS);
      vi.mocked(transformVdpToWelcomeBackShape).mockReturnValueOnce(MOCK_WELCOME_BACK_RESPONSE);

      const response = await GET(buildRequest(), buildParams("jteru5jr7n6123456"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.vin).toBe(KNOWN_VIN);
    });

    it("forwards visitor header from request", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce(MOCK_VDP_SUCCESS);
      vi.mocked(transformVdpToWelcomeBackShape).mockReturnValueOnce(MOCK_WELCOME_BACK_RESPONSE);

      const response = await GET(
        buildRequest({
          "X-Visitor-Id": "visitor-abc",
        }),
        buildParams(KNOWN_VIN)
      );

      expect(response.status).toBe(200);
    });
  });

  describe("VIN validation", () => {
    it("returns 400 for a VIN that is too short", async () => {
      const response = await GET(buildRequest(), buildParams("ABC123"));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN that is too long", async () => {
      const response = await GET(buildRequest(), buildParams("JTERU5JR7N6123456X"));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_VIN");
    });

    it("returns 400 for a VIN containing invalid characters (I, O, Q)", async () => {
      const response = await GET(
        buildRequest(),
        buildParams("ITERU5JR7N6123456") // starts with I
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_VIN");
    });
  });

  describe("not found path", () => {
    it("returns 404 for an unknown VIN", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce({
        success: false,
        error: {
          code: "VDP_NOT_FOUND",
          message: "Vehicle not found for VIN: 1HGBH41JXMN109186",
          status: 404,
        },
      });

      const response = await GET(buildRequest(), buildParams("1HGBH41JXMN109186"));

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("VDP_NOT_FOUND");
    });
  });

  describe("error handling", () => {
    it("returns 500 when the service throws an unexpected error", async () => {
      vi.mocked(getVehicleDetail).mockRejectedValueOnce(new Error("Unexpected failure"));

      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    it("returns 404 when the adapter reports a missing vehicle", async () => {
      vi.mocked(getVehicleDetail).mockResolvedValueOnce(MOCK_VDP_SUCCESS);
      vi.mocked(transformVdpToWelcomeBackShape).mockReturnValueOnce({
        error: { code: "VEHICLE_NOT_FOUND", message: "Vehicle data unavailable" },
      });

      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("VEHICLE_NOT_FOUND");
    });
  });
});
