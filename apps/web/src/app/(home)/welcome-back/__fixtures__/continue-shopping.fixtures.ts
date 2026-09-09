import type { VehicleHistoryItem } from "@shared/lib/vehicle-history/vehicle-history-collection";

const NOW = Date.now();

/**
 * Mock vehicles for continue-shopping carousel tests.
 */
export const mockContinueShoppingVehicles: VehicleHistoryItem[] = [
  {
    id: "cs-1",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid XLE",
    vin: "3TMDZ5BN8NM126690",
    price: 45_000,
    mileage: 15_243,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
    viewedAt: NOW - 3000,
    href: "/used-cars/details/Toyota/Highlander/Hybrid%20XLE/3TMDZ5BN8NM126690",
  },
  {
    id: "cs-2",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    vin: "2T1BURHE0JC048817",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "/inventory-card/inventory-card2.png",
    showBadge: false,
    viewedAt: NOW - 2000,
    href: "/used-cars/details/Toyota/Camry/SE/2T1BURHE0JC048817",
  },
  {
    id: "cs-3",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    vin: "JTMRJREV5HD107836",
    price: 42_000,
    mileage: 8120,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
    viewedAt: NOW - 1000,
    href: "/used-cars/details/Toyota/RAV4/Prime/JTMRJREV5HD107836",
  },
];

/**
 * Single vehicle for minimal rendering tests.
 */
export const mockSingleVehicle: VehicleHistoryItem = {
  id: "cs-single",
  make: "Toyota",
  model: "Corolla",
  year: 2024,
  trim: "Hybrid LE",
  vin: "JTDBR3FE0PA123456",
  price: 26_000,
  mileage: 5400,
  imageUrl: "/inventory-card/inventory-card1.png",
  showBadge: false,
  viewedAt: NOW,
  href: "/used-cars/details/Toyota/Corolla/Hybrid%20LE/JTDBR3FE0PA123456",
};

/**
 * Empty vehicles array for edge case testing.
 */
export const mockEmptyVehicles: VehicleHistoryItem[] = [];
