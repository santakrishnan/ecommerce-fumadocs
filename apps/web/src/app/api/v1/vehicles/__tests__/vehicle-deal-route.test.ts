// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { GET } from "../[vin]/deal/route";

const KNOWN_VIN = "JTERU5JR7N6123456";

/** Helper to build a minimal NextRequest with optional headers. */
function buildRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/vehicles/JTERU5JR7N6123456/deal", {
    method: "GET",
    headers,
  }) as unknown as Parameters<typeof GET>[0];
}

/** Helper to build params as a Promise (Next.js 16 convention). */
function buildParams(vin: string) {
  return { params: Promise.resolve({ vin }) };
}

describe("GET /api/v1/vehicles/[vin]/deal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("success path", () => {
    it("returns 200 with deal data for a known VIN", async () => {
      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.vin).toBe(KNOWN_VIN);
      expect(body.financing).toBeDefined();
    });

    it("returns financing details in the response", async () => {
      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));
      const body = await response.json();

      expect(body.financing).toMatchObject({
        monthlyPayment: 408,
        totalPrice: 32_490,
        termMonths: 60,
        aprPercent: 5.49,
        minCreditScore: 700,
      });
    });

    it("returns buyNowHref containing the VIN", async () => {
      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));
      const body = await response.json();

      expect(body.buyNowHref).toBe(`/vehicle/${KNOWN_VIN}/buy`);
    });

    it("returns urgencyMessage", async () => {
      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));
      const body = await response.json();

      expect(body.urgencyMessage).toBe("Act fast, these models usually sell within 5 days");
    });

    it("normalizes VIN to uppercase", async () => {
      const response = await GET(buildRequest(), buildParams("jteru5jr7n6123456"));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.vin).toBe(KNOWN_VIN);
    });

    it("forwards visitor and session headers from request", async () => {
      const response = await GET(
        buildRequest({
          "X-Visitor-Id": "visitor-abc",
          "X-Session-Id": "session-xyz",
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
        buildParams("OTERU5JR7N6123456") // starts with O
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_VIN");
    });
  });

  describe("not found path", () => {
    it("returns 404 for an unknown VIN", async () => {
      const response = await GET(buildRequest(), buildParams("1HGBH41JXMN109186"));

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBe("DEAL_NOT_FOUND");
    });
  });

  describe("error handling", () => {
    it("returns 500 when the service throws an unexpected error", async () => {
      const mod = await import("@features/landing/bff/services/get-vehicle-deal");
      vi.spyOn(mod, "getVehicleDeal").mockRejectedValueOnce(new Error("Unexpected failure"));

      const response = await GET(buildRequest(), buildParams(KNOWN_VIN));

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
