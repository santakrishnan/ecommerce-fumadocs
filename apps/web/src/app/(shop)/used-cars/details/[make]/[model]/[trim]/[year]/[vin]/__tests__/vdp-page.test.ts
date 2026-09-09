// @vitest-environment node
/**
 * VDP Page Props Validation Tests
 *
 * Fixture-level tests validating the data structure and props
 * required by the VDP page and AskQuestionCard component:
 * 1. FAQ heading structure and availability
 * 2. FAQ questions mapping to string array format
 * 3. Vehicle + FAQ data consistency
 * 4. AskQuestionCard props construction from fixtures
 *
 * Note: These are fixture validation tests, not integration tests
 * that exercise the actual page component or getVehicleDetail.
 */

import {
  getFaqForVin,
  VDP_VEHICLES_BY_VIN,
  VDP_VINS,
} from "@features/vehicle-detail/__fixtures__/vehicle-detail.fixtures";
import { VDP_RESPONSE_DEFAULT_FIXTURE } from "@features/vehicle-detail/bff";
import { describe, expect, it } from "vitest";

describe("VDP Page - FAQ Heading and Questions Extraction", () => {
  // ─── Test 1: FAQ Heading Extraction ─────────────────────────────────

  describe("FAQ Heading Extraction", () => {
    it("should extract FAQ heading from Highlander VDP response", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);

      expect(faq.heading).toBeDefined();
      expect(typeof faq.heading).toBe("string");
      expect(faq.heading.length).toBeGreaterThan(0);
    });

    it("should extract FAQ heading from RAV4 VDP response", () => {
      const vin = VDP_VINS.rav4Estimate;
      const faq = getFaqForVin(vin);

      expect(faq.heading).toBeDefined();
      expect(typeof faq.heading).toBe("string");
    });

    it("should return the same static FAQ for all vehicles", () => {
      const highlanderFaq = getFaqForVin(VDP_VINS.highlanderDefault);
      const rav4Faq = getFaqForVin(VDP_VINS.rav4Estimate);

      expect(highlanderFaq.id).toBe(rav4Faq.id);
      expect(highlanderFaq.questions).toEqual(rav4Faq.questions);
    });

    it("should provide heading as fallback if FAQ missing", () => {
      const unknownFaq = getFaqForVin("UNKNOWNVIN000000");
      expect(unknownFaq.heading).toBeDefined();
      expect(unknownFaq.heading).toBe("Questions about this vehicle?");
    });
  });

  // ─── Test 2: FAQ Questions Extraction ───────────────────────────────────

  describe("FAQ Questions Extraction", () => {
    it("should extract FAQ questions array for Highlander", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);

      expect(faq).toBeDefined();
      expect(Array.isArray(faq.questions)).toBe(true);
      expect(faq.questions.length).toBeGreaterThan(0);
    });

    it("should extract FAQ questions array for RAV4", () => {
      const vin = VDP_VINS.rav4Estimate;
      const faq = getFaqForVin(vin);

      expect(faq).toBeDefined();
      expect(Array.isArray(faq.questions)).toBe(true);
      expect(faq.questions.length).toBeGreaterThan(0);
    });

    it("should map FAQ questions to strings for AskQuestionCard", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);

      // Simulate what the page does
      const faqQuestions = faq.questions.map((q) => q.question);

      expect(Array.isArray(faqQuestions)).toBe(true);
      expect(faqQuestions.every((q) => typeof q === "string")).toBe(true);
      expect(faqQuestions.every((q) => q.length > 0)).toBe(true);
    });

    it("should pass FAQ questions to AskQuestionCard with correct format", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);
      const faqQuestions = faq.questions.map((q) => q.question);

      // AskQuestionCard expects suggestions: string[]
      expect(Array.isArray(faqQuestions)).toBe(true);
      for (const question of faqQuestions) {
        expect(typeof question).toBe("string");
        expect(question.length).toBeGreaterThan(0);
      }
    });

    it("should have questions that are actual questions (end with ?)", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);
      const faqQuestions = faq.questions.map((q) => q.question);

      for (const question of faqQuestions) {
        expect(question.trim().endsWith("?")).toBe(true);
      }
    });
  });

  // ─── Test 3: VDP Response Structure ─────────────────────────────────

  describe("VDP Response Structure", () => {
    it("should have FAQ data with both heading and questions", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);

      expect(faq).toBeDefined();
      expect(faq.id).toBeDefined();
      expect(faq.heading).toBeDefined();
      expect(faq.questions).toBeDefined();
      expect(Array.isArray(faq.questions)).toBe(true);
    });

    it("should have all required fields for AskQuestionCard props", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];
      const faq = getFaqForVin(vin);

      // Simulate page props extraction
      const props = {
        heading: faq.heading,
        model: vehicle?.vehicleInfo.model,
        suggestions: faq.questions.map((q) => q.question),
        trim: vehicle?.vehicleInfo.trim,
        vin: vehicle?.vin,
        year: vehicle?.vehicleInfo.year,
      };

      expect(props.heading).toBeDefined();
      expect(props.model).toBeDefined();
      expect(props.trim).toBeDefined();
      expect(props.year).toBeDefined();
      expect(props.vin).toBeDefined();
      expect(Array.isArray(props.suggestions)).toBe(true);
    });
  });

  // ─── Test 4: Data Consistency Between Vehicle and FAQ ──────────────────

  describe("Data Consistency", () => {
    it("should have matching VIN in vehicle and FAQ lookup", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];
      const faq = getFaqForVin(vin);

      expect(vehicle?.vin).toBe(vin);
      expect(faq).toBeDefined();
    });

    it("should have FAQ for every vehicle in VDP_VEHICLES_BY_VIN", () => {
      for (const vin of Object.keys(VDP_VEHICLES_BY_VIN)) {
        const faq = getFaqForVin(vin);
        expect(faq).toBeDefined();
        expect(faq.heading).toBeDefined();
        expect(faq.questions.length).toBeGreaterThan(0);
      }
    });

    it("should have consistent vehicle model in fixture", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];

      expect(vehicle?.vehicleInfo.model).toBe("Highlander");
      expect(vehicle?.vehicleInfo.trim).toBe("Hybrid Limited");
    });
  });

  // ─── Test 5: Consolidated VDP Data (no fetch-vdp-data.ts needed) ──────────────────────

  describe("Consolidated VDP Data", () => {
    it("should get FAQ heading directly from fixtures without separate fetch", () => {
      const vin = VDP_VINS.highlanderDefault;

      // Should work directly from fixtures - no need for fetch-vdp-data service
      const faq = getFaqForVin(vin);
      const heading = faq.heading;

      expect(heading).toBeDefined();
      expect(typeof heading).toBe("string");
      expect(heading.length).toBeGreaterThan(0);
    });

    it("should get FAQ questions directly from fixtures without separate fetch", () => {
      const vin = VDP_VINS.highlanderDefault;

      // Should work directly from fixtures - no need for fetch-vdp-data service
      const faq = getFaqForVin(vin);
      const faqQuestions = faq.questions.map((q) => q.question);

      expect(Array.isArray(faqQuestions)).toBe(true);
      expect(faqQuestions.length).toBeGreaterThan(0);
    });
  });

  // ─── Test 6: Default VDP Fixture for Purchase Card Fallback ───────────────

  describe("Default VDP Fixture", () => {
    it("should include schedule slots for the purchase card fallback", () => {
      const testDrive = VDP_RESPONSE_DEFAULT_FIXTURE.data.dealer?.extended?.testDrive;

      expect(testDrive).toBeDefined();
      expect(testDrive?.dayLabel).toBe("Today");
      expect(testDrive?.slots.length).toBeGreaterThan(0);
    });
  });

  // ─── Test 7: AskQuestionCard Props Validation ───────────────────────────────

  describe("AskQuestionCard Props Validation", () => {
    it("should provide all required props to AskQuestionCard", () => {
      const vin = VDP_VINS.highlanderDefault;
      const vehicle = VDP_VEHICLES_BY_VIN[vin];
      const faq = getFaqForVin(vin);

      const props = {
        heading: faq.heading,
        model: vehicle?.vehicleInfo.model ?? "Unknown",
        suggestions: faq.questions.map((q) => q.question),
        trim: vehicle?.vehicleInfo.trim ?? "Unknown",
        vin: vehicle?.vin ?? vin,
        year: vehicle?.vehicleInfo.year ?? 2024,
      };

      // Validate all props are present and correct type
      expect(typeof props.heading).toBe("string");
      expect(typeof props.model).toBe("string");
      expect(typeof props.trim).toBe("string");
      expect(typeof props.year).toBe("number");
      expect(typeof props.vin).toBe("string");
      expect(Array.isArray(props.suggestions)).toBe(true);

      // Validate values are not empty
      expect(props.heading.length).toBeGreaterThan(0);
      expect(props.model.length).toBeGreaterThan(0);
      expect(props.trim.length).toBeGreaterThan(0);
      expect(props.year).toBeGreaterThan(0);
      expect(props.vin.length).toBe(17); // VIN is 17 chars
      expect(props.suggestions.length).toBeGreaterThan(0);
    });

    it("should use FAQ heading from fixtures for AskQuestionCard heading prop", () => {
      const vin = VDP_VINS.highlanderDefault;
      const faq = getFaqForVin(vin);

      const headingForCard = faq.heading;

      // AskQuestionCard renders the heading directly from FAQ fixtures
      expect(headingForCard).toBeDefined();
      expect(typeof headingForCard).toBe("string");
      expect(headingForCard.length).toBeGreaterThan(0);
    });
  });
});
