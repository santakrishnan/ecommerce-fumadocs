import { describe, expect, it } from "vitest";
import {
  FIXTURE_ALL_VEHICLES,
  FIXTURE_CAMRY,
  FIXTURE_HIGHLANDER,
  FIXTURE_RAV4,
} from "../__fixtures__/search-inventory-cards"; // Fixtures now mirror mock-inventory-cards.ts

const IMAGE_URL_PATTERN = /\.(png|jpg|jpeg|webp)$/i;

describe("SearchInventoryCarousel Fixtures", () => {
  // These fixtures mirror the data structure in mock-inventory-cards.ts and are used to test
  // the carousel component and service layer integration.
  describe("Fixtures - Highlander", () => {
    it("should have valid Highlander fixture with all properties", () => {
      expect(FIXTURE_HIGHLANDER.id).toBe("1");
      expect(FIXTURE_HIGHLANDER.make).toBe("Toyota");
      expect(FIXTURE_HIGHLANDER.model).toBe("Highlander");
      expect(FIXTURE_HIGHLANDER.year).toBe(2024);
      expect(FIXTURE_HIGHLANDER.trim).toBe("Hybrid XLE");
      expect(FIXTURE_HIGHLANDER.price).toBe(45_000);
      expect(FIXTURE_HIGHLANDER.mileage).toBe(15_243);
      expect(FIXTURE_HIGHLANDER.imageUrl).toBe("/inventory-card/inventory-card1.png");
      expect(FIXTURE_HIGHLANDER.aiDescription).toBe("Midnight Edition Package");
    });
  });

  describe("Fixtures - Camry", () => {
    it("should have valid Camry fixture with all properties", () => {
      expect(FIXTURE_CAMRY.id).toBe("2");
      expect(FIXTURE_CAMRY.make).toBe("Toyota");
      expect(FIXTURE_CAMRY.model).toBe("Camry");
      expect(FIXTURE_CAMRY.year).toBe(2023);
      expect(FIXTURE_CAMRY.trim).toBe("SE");
      expect(FIXTURE_CAMRY.price).toBe(28_500);
      expect(FIXTURE_CAMRY.mileage).toBe(22_500);
      expect(FIXTURE_CAMRY.imageUrl).toBe("/inventory-card/inventory-card2.png");
      expect(FIXTURE_CAMRY.aiDescription).toBe("The barely-driven. 6K miles");
    });
  });

  describe("Fixtures - RAV4", () => {
    it("should have valid RAV4 fixture with all properties", () => {
      expect(FIXTURE_RAV4.id).toBe("3");
      expect(FIXTURE_RAV4.make).toBe("Toyota");
      expect(FIXTURE_RAV4.model).toBe("RAV4");
      expect(FIXTURE_RAV4.year).toBe(2024);
      expect(FIXTURE_RAV4.trim).toBe("Prime");
      expect(FIXTURE_RAV4.price).toBe(42_000);
      expect(FIXTURE_RAV4.mileage).toBe(8120);
      expect(FIXTURE_RAV4.imageUrl).toBe("/inventory-card/inventory-card3.png");
      expect(FIXTURE_RAV4.aiDescription).toBe("Midnight Edition Package");
    });
  });

  describe("Fixtures - Collection", () => {
    it("should have all vehicles in collection", () => {
      expect(FIXTURE_ALL_VEHICLES.length).toBe(3);
    });

    it("should have correct vehicles in collection", () => {
      expect(FIXTURE_ALL_VEHICLES).toContain(FIXTURE_HIGHLANDER);
      expect(FIXTURE_ALL_VEHICLES).toContain(FIXTURE_CAMRY);
      expect(FIXTURE_ALL_VEHICLES).toContain(FIXTURE_RAV4);
    });

    it("should have vehicles in correct order", () => {
      expect(FIXTURE_ALL_VEHICLES[0]).toBe(FIXTURE_HIGHLANDER);
      expect(FIXTURE_ALL_VEHICLES[1]).toBe(FIXTURE_CAMRY);
      expect(FIXTURE_ALL_VEHICLES[2]).toBe(FIXTURE_RAV4);
    });
  });

  describe("Fixture Data Consistency", () => {
    it("should have unique IDs across fixtures", () => {
      const ids = FIXTURE_ALL_VEHICLES.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it("should have valid prices for all fixtures", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.price).toBeGreaterThan(0);
      }
    });

    it("should have valid mileage for all fixtures", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.mileage).toBeGreaterThanOrEqual(0);
      }
    });

    it("should have valid years for all fixtures", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.year).toBeGreaterThanOrEqual(2020);
        expect(vehicle.year).toBeLessThanOrEqual(2025);
      }
    });

    it("should have required image URLs", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.imageUrl).toBeTruthy();
        expect(vehicle.imageUrl).toMatch(IMAGE_URL_PATTERN);
      }
    });

    it("should have AI descriptions for all fixtures", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.aiDescription).toBeTruthy();
        if (vehicle.aiDescription) {
          expect(vehicle.aiDescription.length).toBeGreaterThan(0);
        }
      }
    });

    it("should all be Toyota vehicles", () => {
      for (const vehicle of FIXTURE_ALL_VEHICLES) {
        expect(vehicle.make).toBe("Toyota");
      }
    });
  });
});
