import type { EditorialContent } from "@features/landing/data/schemas/editorial-content";

export const validEditorialContent = {
  heroHeadline: "Find Your Perfect Vehicle Today",
  heroSubheading: "Browse thousands of new and pre-owned vehicles from trusted dealers near you.",
  heroCtaLabel: "Shop Now",
  heroCtaUrl: "https://example.com/vehicles",
  heroImageUrl: "https://cdn.example.com/hero/vehicles-hero.jpg",
} as const satisfies EditorialContent;
