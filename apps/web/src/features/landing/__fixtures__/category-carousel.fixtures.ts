import type { CategoryCardData } from "../types";

/**
 * Mock category data for testing the CategoryCarousel component.
 */
export const mockCategories: CategoryCardData[] = [
  {
    name: "CARS & MINIVANS",
    description: "Sedans, coupes, and family vehicles",
    imageUrl: "/category-card/cars.png",
    imageAlt: "Cars and minivans category",
    shopUrl: "/search?category=cars",
  },
  {
    name: "TRUCKS",
    description: "Pickup trucks and commercial vehicles",
    imageUrl: "/category-card/trucks.png",
    imageAlt: "Trucks category",
    shopUrl: "/search?category=trucks",
  },
  {
    name: "SUVS",
    description: "Sport utility vehicles and crossovers",
    imageUrl: "/category-card/suvs.png",
    imageAlt: "SUVs category",
    shopUrl: "/search?category=suvs",
  },
  {
    name: "HYBRIDS",
    description: "Fuel-efficient hybrid vehicles",
    imageUrl: "/category-card/hybrids.png",
    imageAlt: "Hybrids category",
    shopUrl: "/search?category=hybrids",
  },
];

/**
 * Single category for testing individual card rendering.
 */
export const singleCategory: CategoryCardData = mockCategories[0] as CategoryCardData;

/**
 * Empty categories array for testing empty state.
 */
export const emptyCategories: CategoryCardData[] = [];
