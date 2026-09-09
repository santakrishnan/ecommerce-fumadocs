import type { Category } from "@features/landing/data/schemas/category";

export const validCategory = {
  id: "cat-vehicles",
  label: "Browse Vehicles",
  href: "/vehicles",
  imageUrl: "https://cdn.example.com/categories/vehicles.jpg",
  description: "Search new and pre-owned vehicles from dealers near you.",
} as const satisfies Category;
