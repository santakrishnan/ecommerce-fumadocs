// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { getVehicleDeal } from "../services/get-vehicle-deal";

const KNOWN_VIN = "JTERU5JR7N6123456";
const UNKNOWN_VIN = "00000000000000000";

describe("getVehicleDeal", () => {
  describe("known VIN (fixture path)", () => {
    it("returns a VehicleDealResponse for a known VIN", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      expect(result).not.toHaveProperty("error");
      expect(result).toHaveProperty("vin", KNOWN_VIN);
    });

    it("returns financing details", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      if ("error" in result) {
        throw new Error("Expected success result");
      }

      expect(result.financing).toMatchObject({
        monthlyPayment: 408,
        totalPrice: 32_490,
        msrp: 36_900,
        termMonths: 60,
        aprPercent: 5.49,
        minCreditScore: 700,
      });
    });

    it("returns urgency message", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      if ("error" in result) {
        throw new Error("Expected success result");
      }

      expect(result.urgencyMessage).toBe("Act fast, these models usually sell within 5 days");
    });

    it("returns buyNowHref containing the VIN", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      if ("error" in result) {
        throw new Error("Expected success result");
      }

      expect(result.buyNowHref).toBe(`/vehicle/${KNOWN_VIN}/buy`);
    });

    it("accepts optional input parameter without error", async () => {
      const result = await getVehicleDeal(KNOWN_VIN, {
        sessionId: "sess-123",
        visitorId: "vis-456",
      });

      expect(result).not.toHaveProperty("error");
    });
  });

  describe("unknown VIN (not found path)", () => {
    it("returns a DEAL_NOT_FOUND error for unknown VINs", async () => {
      const result = await getVehicleDeal(UNKNOWN_VIN);

      expect(result).toHaveProperty("error");
      if (!("error" in result)) {
        throw new Error("Expected error result");
      }

      expect(result.error.code).toBe("DEAL_NOT_FOUND");
      expect(result.error.message).toContain(UNKNOWN_VIN);
    });

    it("does not cache the not-found response", async () => {
      const { cacheLife, cacheTag } = await import("next/cache");

      vi.mocked(cacheLife).mockClear();
      vi.mocked(cacheTag).mockClear();

      await getVehicleDeal(UNKNOWN_VIN);

      expect(cacheLife).not.toHaveBeenCalled();
      expect(cacheTag).not.toHaveBeenCalled();
    });
  });

  describe("fixture validation", () => {
    it("returns data conforming to dealLookupResponseSchema constraints", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      if ("error" in result) {
        throw new Error("Expected success result");
      }

      // VIN must be exactly 17 characters
      expect(result.vin).toHaveLength(17);
      // Financing values within schema bounds
      expect(result.financing.monthlyPayment).toBeGreaterThanOrEqual(0);
      expect(result.financing.termMonths).toBeGreaterThanOrEqual(1);
      expect(result.financing.termMonths).toBeLessThanOrEqual(120);
      expect(result.financing.aprPercent).toBeGreaterThanOrEqual(0);
      expect(result.financing.aprPercent).toBeLessThanOrEqual(100);
      expect(result.financing.minCreditScore).toBeGreaterThanOrEqual(300);
      expect(result.financing.minCreditScore).toBeLessThanOrEqual(850);
    });

    it("returns a non-empty buyNowHref", async () => {
      const result = await getVehicleDeal(KNOWN_VIN);

      if ("error" in result) {
        throw new Error("Expected success result");
      }

      expect(result.buyNowHref.length).toBeGreaterThan(0);
    });
  });

  describe("second known VIN", () => {
    const RAV4_VIN = "2T1BURHE8JC039175";

    it("returns deal data for the RAV4 fixture VIN", async () => {
      const result = await getVehicleDeal(RAV4_VIN);

      expect(result).not.toHaveProperty("error");
      if ("error" in result) {
        throw new Error("Expected success result");
      }

      expect(result.vin).toBe(RAV4_VIN);
      expect(result.buyNowHref).toBe(`/vehicle/${RAV4_VIN}/buy`);
    });
  });
});
