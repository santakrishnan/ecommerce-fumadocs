import type { Vehicle } from "@shared/components/inventory-card";

/**
 * Test fixtures for SearchInventoryCarousel component.
 * These fixtures mirror the structure and data from mock-inventory-cards.ts
 * to ensure consistent testing of the carousel component and service layer.
 */

/**
 * Fixture: Toyota Highlander Hybrid XLE
 */
export const FIXTURE_HIGHLANDER: Vehicle = {
  id: "1",
  make: "Toyota",
  model: "Highlander",
  year: 2024,
  trim: "Hybrid XLE",
  price: 45_000,
  mileage: 15_243,
  imageUrl: "/inventory-card/inventory-card1.png",
  aiDescription: "Midnight Edition Package",
};

/**
 * Fixture: Toyota Camry SE
 */
export const FIXTURE_CAMRY: Vehicle = {
  id: "2",
  make: "Toyota",
  model: "Camry",
  year: 2023,
  trim: "SE",
  price: 28_500,
  mileage: 22_500,
  imageUrl: "/inventory-card/inventory-card2.png",
  aiDescription: "The barely-driven. 6K miles",
};

/**
 * Fixture: Toyota RAV4 Prime
 */
export const FIXTURE_RAV4: Vehicle = {
  id: "3",
  make: "Toyota",
  model: "RAV4",
  year: 2024,
  trim: "Prime",
  price: 42_000,
  mileage: 8120,
  imageUrl: "/inventory-card/inventory-card3.png",
  aiDescription: "Midnight Edition Package",
};

/**
 * Fixture: Set of all mock vehicles
 */
export const FIXTURE_ALL_VEHICLES: Vehicle[] = [FIXTURE_HIGHLANDER, FIXTURE_CAMRY, FIXTURE_RAV4];
