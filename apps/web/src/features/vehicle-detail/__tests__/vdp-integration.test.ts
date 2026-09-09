// @vitest-environment node
/**
 * VDP Integration Tests — Fixture-Level Validation
 *
 * Validates the vehicle fixture registry and FAQ system:
 * 1. Vehicle fixture registration and accessibility
 * 2. FAQ data structure and retrieval via getFaqForVin()
 * 3. Vehicle + FAQ data consistency across all registered VINs
 * 4. Edge case handling (empty/whitespace/long VINs, case-insensitivity)
 * 5. Fixture integrity (unique IDs, valid coordinates, media presence)
 *
 * Note: These are fixture validation tests, not page component tests.
 * For actual page behavior testing, see vdp-page.test.ts.
 */

import {
  getFaqForVin,
  VDP_VEHICLES_BY_VIN,
  VDP_VINS,
} from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { describe, expect, it } from "vitest";

const VEHICLE_STATUS_PATTERN = /In Stock|Sold/;

describe("VDP Integration Tests", () => {
  // ─── Test 1: Vehicle Fixtures Include All Test VINs ────────────────────

  describe("Vehicle Fixtures", () => {
    it("should have Highlander default vehicle registered", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];

      expect(vehicle).toBeDefined();
      expect(vehicle?.vin).toBe(vin);
      expect(vehicle?.vehicleInfo.make).toBe("Toyota");
      expect(vehicle?.vehicleInfo.model).toBe("Highlander");
    });

    it("should have RAV4 estimate vehicle registered", () => {
      const vin = VDP_VINS.rav4Estimate;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];

      expect(vehicle).toBeDefined();
      expect(vehicle?.vin).toBe(vin);
      expect(vehicle?.vehicleInfo.make).toBe("Toyota");
      expect(vehicle?.vehicleInfo.model).toBe("RAV4");
    });

    it("should have sold vehicle registered", () => {
      const vin = VDP_VINS.highlanderSold;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];

      expect(vehicle).toBeDefined();
      expect(vehicle?.vin).toBe(vin);
      expect(vehicle?.status.vehicleStatus).toBe("Sold");
      expect(vehicle?.vehicleInfo.isActive).toBe(false);
      expect(vehicle?.soldAt).toBeDefined();
    });

    it("should have 4Runner dealer deal vehicle registered", () => {
      const vin = VDP_VINS.fourRunnerDealerDeal;
      // biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
      const vehicle = VDP_VEHICLES_BY_VIN[vin]!;

      expect(vehicle).toBeDefined();
      expect(vehicle.vin).toBe(vin);
      expect(vehicle.vehicleInfo.make).toBe("Toyota");
      expect(vehicle.vehicleInfo.model).toBe("4Runner");
      expect(vehicle.vehicleInfo.trim).toBe("TRD Off Road");
      expect((vehicle.media.photos ?? []).length).toBeGreaterThan(0);
      expect(vehicle.media.photos?.[0]?.url).toContain("four-runner-img.png");
    });

    it("should have all demo vehicles registered", () => {
      // Upstream VINs (prefixed with "upstream") are fetched from the real API
      // and don't need local fixture entries in VDP_VEHICLES_BY_VIN.
      const localVins = Object.entries(VDP_VINS)
        .filter(([key]) => !key.startsWith("upstream"))
        .map(([, vin]) => vin);
      for (const vin of localVins) {
        expect(VDP_VEHICLES_BY_VIN).toHaveProperty(vin);
      }
    });
  });

  // ─── Test 2: FAQ Extraction and Fallback ────────────────────────────────

  describe("FAQ Extraction (getFaqForVin)", () => {
    it("should return FAQ for Highlander default VIN", () => {
      const faq = getFaqForVin(VDP_VINS.highlanderDefault);

      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
      expect(faq.questions.length).toBeGreaterThan(0);
      expect(faq.questions[0]?.question).toBeDefined();
    });

    it("should return FAQ for RAV4 estimate VIN", () => {
      const faq = getFaqForVin(VDP_VINS.rav4Estimate);

      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
      expect(faq.questions.length).toBeGreaterThan(0);
    });

    it("should return generic FAQ for unknown VIN", () => {
      const unknownVin = "UNKNOWNVIN000000";
      const faq = getFaqForVin(unknownVin);

      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
      expect(faq.questions.length).toBeGreaterThan(0);
    });

    it("should handle case-insensitive VIN lookup", () => {
      const faqUppercase = getFaqForVin("3TMCZ5AN8PM000001");
      const faqLowercase = getFaqForVin("3tmcz5an8pm000001");
      const faqMixed = getFaqForVin("3TmCz5An8Pm000001");

      expect(faqUppercase.id).toBe(faqLowercase.id);
      expect(faqLowercase.id).toBe(faqMixed.id);
    });

    it("should include heading field in FAQ", () => {
      const faq = getFaqForVin(VDP_VINS.highlanderDefault);

      expect(faq).toHaveProperty("heading");
      expect(typeof faq.heading).toBe("string");
      expect(faq.heading.length).toBeGreaterThan(0);
    });

    it("should have all FAQ questions with id and question fields", () => {
      const faq = getFaqForVin(VDP_VINS.highlanderDefault);

      for (const question of faq.questions) {
        expect(question).toHaveProperty("id");
        expect(question).toHaveProperty("question");
        expect(typeof question.id).toBe("string");
        expect(typeof question.question).toBe("string");
        expect(question.id.length).toBeGreaterThan(0);
        expect(question.question.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Test 4: Data Consistency ───────────────────────────────────────────

  describe("Data Consistency", () => {
    it("should have all vehicles with required vehicleInfo properties", () => {
      for (const [, vehicle] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.vehicleInfo).toBeDefined();
        expect(vehicle.vehicleInfo.make).toBeDefined();
        expect(vehicle.vehicleInfo.model).toBeDefined();
        expect(vehicle.vehicleInfo.trim).toBeDefined();
        expect(vehicle.vehicleInfo.year).toBeGreaterThan(2000);
      }
    });

    it("should have all vehicles with valid pricing", () => {
      for (const [, vehicle] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.pricing).toBeDefined();
        expect(vehicle.pricing.listPrice).toBeGreaterThan(0);
        expect(vehicle.pricing.sellingPrice).toBeGreaterThan(0);
      }
    });

    it("should have all vehicles with valid status", () => {
      for (const [, vehicle] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.status).toBeDefined();
        expect(vehicle.status.vehicleStatus).toMatch(VEHICLE_STATUS_PATTERN);
        expect(vehicle.status.mileage).toBeGreaterThanOrEqual(0);
      }
    });

    it("should have all vehicles with warranty information", () => {
      for (const [, vehicle] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.warranty).toBeDefined();
        expect(vehicle.warranty.basic).toBeDefined();
        expect(vehicle.warranty.powertrain).toBeDefined();
      }
    });

    it("should have FAQ for every registered VIN", () => {
      for (const [vin] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        const faq = getFaqForVin(vin);
        expect(faq).toBeDefined();
        expect(faq.questions.length).toBeGreaterThan(0);
      }
    });

    it("should have all vehicles with at least one feature category", () => {
      for (const [, vehicle] of Object.entries(VDP_VEHICLES_BY_VIN)) {
        const categories = vehicle.features.byCategory;
        expect(categories).toBeDefined();
        expect(categories?.length).toBeGreaterThan(0);
        expect(categories?.[0]?.items.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Test 5: Removal of fetch-vdp-data.ts Consolidation ──────────────────

  describe("Consolidation of VDP Data Fetching", () => {
    it("should have FAQ data consolidated in vehicle fixtures (not separate file)", () => {
      // Verify FAQ_BY_VIN exists and is properly mapped
      const faq = getFaqForVin(VDP_VINS.highlanderDefault);
      expect(faq).toBeDefined();
      expect(faq.id).toBeDefined();
    });

    it("should be able to get complete vehicle + FAQ from fixtures without separate service", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];
      const faq = getFaqForVin(vin);

      // Both should be available from consolidated fixtures
      expect(vehicle).toBeDefined();
      expect(faq).toBeDefined();

      // Vehicle should have all necessary fields for constructing vehicle name
      expect(vehicle?.vehicleInfo.make).toBeDefined();
      expect(vehicle?.vehicleInfo.model).toBeDefined();
      expect(vehicle?.vehicleInfo.trim).toBeDefined();
    });

    it("should handle very long VIN strings gracefully", () => {
      const faq = getFaqForVin("VERYLONGVINSTRINGTHATSHOULDNTEXIST123456789");
      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
    });
  });

  // ─── Test 6: Edge Cases ─────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("should handle empty VIN string gracefully", () => {
      const faq = getFaqForVin("");
      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
    });

    it("should handle whitespace-only VIN gracefully", () => {
      const faq = getFaqForVin("   ");
      expect(faq).toBeDefined();
      expect(faq.id).toBe("faq-default");
    });

    it("should have sold vehicle with soldAt timestamp", () => {
      const vehicle = VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderSold];
      expect(vehicle?.soldAt).toBeDefined();
      expect(vehicle?.status.vehicleStatus).toBe("Sold");
      expect(vehicle?.vehicleInfo.isActive).toBe(false);
    });

    it("should have in-stock vehicles as active", () => {
      const vehicle = VDP_VEHICLES_BY_VIN[VDP_VINS.highlanderDefault];
      expect(vehicle?.status.vehicleStatus).toBe("In Stock");
      expect(vehicle?.vehicleInfo.isActive).toBe(true);
    });
  });

  // ─── Test 7: Fixture Integrity ──────────────────────────────────────────

  describe("Fixture Integrity", () => {
    it("should have unique vehicleId for each vehicle", () => {
      const vehicleIds = Object.values(VDP_VEHICLES_BY_VIN).map((v) => v.vehicleId);
      const uniqueIds = new Set(vehicleIds);
      expect(uniqueIds.size).toBe(vehicleIds.length);
    });

    it("should have unique stockNumber for each vehicle", () => {
      const stockNumbers = Object.values(VDP_VEHICLES_BY_VIN).map((v) => v.stockNumber);
      const uniqueNumbers = new Set(stockNumbers);
      expect(uniqueNumbers.size).toBe(stockNumbers.length);
    });

    it("should have valid dealerInfo for all vehicles", () => {
      for (const vehicle of Object.values(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.dealerInfo).toBeDefined();
        expect(vehicle.dealerInfo.dealerCode).toBeDefined();
        expect(vehicle.dealerInfo.dealerName).toBeDefined();
        expect(vehicle.dealerInfo.latitude).toBeGreaterThan(-90);
        expect(vehicle.dealerInfo.latitude).toBeLessThan(90);
        expect(vehicle.dealerInfo.longitude).toBeGreaterThan(-180);
        expect(vehicle.dealerInfo.longitude).toBeLessThan(180);
      }
    });

    it("should have media/photos for all vehicles", () => {
      for (const vehicle of Object.values(VDP_VEHICLES_BY_VIN)) {
        expect(vehicle.media).toBeDefined();
        expect(vehicle.media.photos).toBeDefined();
        expect(Array.isArray(vehicle.media.photos)).toBe(true);
      }
    });
  });
});
