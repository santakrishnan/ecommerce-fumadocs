import type { Vehicle } from "@shared/components/inventory-card";

/**
 * Seed dataset for the landing page data service.
 * Typed as `unknown[]` so Zod's safeParse acts as the runtime type gate.
 * All objects satisfy vehicleCardSchema (Requirements 4.3, 5.3).
 */
export const MOCK_VEHICLE_DATASET: unknown[] = [
  {
    id: "veh-001",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "XLE",
    price: 45_000,
    mileage: 15_243,
    imageUrl: "https://cdn.example.com/vehicles/highlander-2024.jpg",
    imageAlt: "2024 Toyota Highlander XLE in silver",
    detailPageUrl: "https://example.com/inventory/veh-001",
  },
  {
    id: "veh-002",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "https://cdn.example.com/vehicles/camry-2023.jpg",
    imageAlt: "2023 Toyota Camry SE in midnight black",
    detailPageUrl: "https://example.com/inventory/veh-002",
  },
  {
    id: "veh-003",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    price: 42_000,
    mileage: 8120,
    imageUrl: "https://cdn.example.com/vehicles/rav4-2024.jpg",
    imageAlt: "2024 Toyota RAV4 Prime in supersonic red",
    detailPageUrl: "https://example.com/inventory/veh-003",
  },
  {
    id: "veh-004",
    make: "Toyota",
    model: "Tacoma",
    year: 2023,
    trim: "TRD Pro",
    price: 48_500,
    mileage: 18_900,
    imageUrl: "https://cdn.example.com/vehicles/tacoma-2023.jpg",
    imageAlt: "2023 Toyota Tacoma TRD Pro in army green",
    detailPageUrl: "https://example.com/inventory/veh-004",
  },
  {
    id: "veh-005",
    make: "Toyota",
    model: "Corolla",
    year: 2024,
    trim: "Hybrid LE",
    price: 26_000,
    mileage: 5400,
    imageUrl: "https://cdn.example.com/vehicles/corolla-2024.jpg",
    imageAlt: "2024 Toyota Corolla Hybrid LE in white",
    detailPageUrl: "https://example.com/inventory/veh-005",
  },
  {
    id: "veh-006",
    make: "Toyota",
    model: "4Runner",
    year: 2023,
    trim: "TRD Off-Road",
    price: 46_500,
    mileage: 12_750,
    imageUrl: "https://cdn.example.com/vehicles/4runner-2023.jpg",
    imageAlt: "2023 Toyota 4Runner TRD Off-Road in midnight black",
    detailPageUrl: "https://example.com/inventory/veh-006",
  },
];

/**
 * Happy-path vehicle fixture for testing.
 * Aligns with VehicleCard schema + UI-specific properties.
 */
export const mockVehicle: Vehicle = {
  id: "test-vehicle-1",
  make: "Toyota",
  model: "Highlander",
  year: 2024,
  trim: "XLE",
  price: 22_500,
  mileage: 30_000,
  imageUrl: "/inventory-card/inventory-card1.png",
  surface: "light",
  showBadge: false,
};

/**
 * Multiple vehicles for carousel/list testing
 */
export const mockVehicles: Vehicle[] = [
  {
    id: "1",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid XLE",
    price: 45_000,
    mileage: 15_243,
    imageUrl: "/inventory-card/inventory-card1.png",
    surface: "light",
    showBadge: false,
  },
  {
    id: "2",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "/inventory-card/inventory-card1.png",
    surface: "dark",
    showBadge: false,
  },
  {
    id: "3",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    price: 42_000,
    mileage: 8120,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
  },
  {
    id: "4",
    make: "Toyota",
    model: "Tacoma",
    year: 2023,
    trim: "TRD Pro",
    price: 48_500,
    mileage: 18_900,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
  },
  {
    id: "5",
    make: "Toyota",
    model: "Corolla",
    year: 2024,
    trim: "Hybrid LE",
    price: 26_000,
    mileage: 5400,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
  },
  {
    id: "6",
    make: "Toyota",
    model: "4Runner",
    year: 2023,
    trim: "TRD Off-Road",
    price: 46_500,
    mileage: 12_750,
    imageUrl: "/inventory-card/inventory-card1.png",
    showBadge: false,
  },
];

/**
 * Edge case: High mileage vehicle
 */
export const mockHighMileageVehicle: Vehicle = {
  id: "high-mileage-1",
  make: "Toyota",
  model: "Camry",
  year: 2018,
  trim: "LE",
  price: 15_000,
  mileage: 150_000,
  imageUrl: "/inventory-card/inventory-card1.png",
  showBadge: false,
};

/**
 * Edge case: Low mileage vehicle
 */
export const mockLowMileageVehicle: Vehicle = {
  id: "low-mileage-1",
  make: "Toyota",
  model: "Corolla",
  year: 2024,
  trim: "SE",
  price: 25_000,
  mileage: 100,
  imageUrl: "/inventory-card/inventory-card1.png",
  showBadge: false,
};

/**
 * Edge case: High price vehicle
 */
export const mockHighPriceVehicle: Vehicle = {
  id: "high-price-1",
  make: "Toyota",
  model: "Land Cruiser",
  year: 2024,
  trim: "Heritage Edition",
  price: 85_000,
  mileage: 5000,
  imageUrl: "/inventory-card/inventory-card1.png",
  showBadge: false,
};
