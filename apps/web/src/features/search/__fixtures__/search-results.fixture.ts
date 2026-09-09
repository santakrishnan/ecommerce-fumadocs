import type { Vehicle } from "@shared/components/inventory-card";
import type { PaginatedData } from "../bff/services/search-results-service";

const baseVehicle: Vehicle = {
  id: "v-1",
  make: "Toyota",
  model: "Highlander",
  year: 2024,
  trim: "Hybrid XLE",
  price: 42_995,
  mileage: 12_450,
  imageUrl: "/inventory-card/inventory-card1.png",
};

export const makeVehicles = (count: number): Vehicle[] =>
  Array.from({ length: count }, (_, index) => ({
    ...baseVehicle,
    id: `v-${index + 1}`,
    model: `Highlander ${index + 1}`,
  }));

/** Single-page result set (totalPages = 1, pagination hidden). */
export const singlePageData: PaginatedData<Vehicle> = {
  currentPage: 1,
  data: makeVehicles(5),
  totalItems: 5,
  totalPages: 1,
};

/** Multi-page result set, currently on page 1 (6 total pages, no ellipsis needed). */
export const sixPageData: PaginatedData<Vehicle> = {
  currentPage: 1,
  data: makeVehicles(24),
  totalItems: 144,
  totalPages: 6,
};

/** Large result set — 50 pages, currently on page 1. */
export const manyPagesFirstData: PaginatedData<Vehicle> = {
  currentPage: 1,
  data: makeVehicles(24),
  totalItems: 1200,
  totalPages: 50,
};

/** Large result set — 50 pages, currently on page 25 (middle). */
export const manyPagesMidData: PaginatedData<Vehicle> = {
  currentPage: 25,
  data: makeVehicles(24),
  totalItems: 1200,
  totalPages: 50,
};

/** Large result set — 50 pages, currently on last page. */
export const manyPagesLastData: PaginatedData<Vehicle> = {
  currentPage: 50,
  data: makeVehicles(24),
  totalItems: 1200,
  totalPages: 50,
};

/** Empty result set. */
export const emptyPageData: PaginatedData<Vehicle> = {
  currentPage: 1,
  data: [],
  totalItems: 0,
  totalPages: 0,
};
