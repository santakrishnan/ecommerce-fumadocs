import type { EditorialCardData } from "@features/landing";

/**
 * Static editorial suggestions for the not-found vehicle page.
 *
 * These are generic search prompts shown when the VIN doesn't resolve to a
 * real vehicle (so taxonomy-based recommendations aren't possible).
 */
export const UNAVAILABLE_VEHICLE_EDITORIAL_CARDS: EditorialCardData[] = [
  {
    eyebrow: "Suggested for you",
    headline: "A 2022–2024 Highlander in Midnight Black Metallic",
    imageUrl: "/editorial-card/img-one.png",
    href: "/search?model=highlander&yearMin=2022&yearMax=2024&color=black",
  },
  {
    eyebrow: "Trending near you",
    headline: "A 2025 Highlander in Heavy Metal or Cement Grey",
    imageUrl: "/editorial-card/image-two.png",
    href: "/search?model=highlander&year=2025&color=grey",
  },
  {
    eyebrow: "Based on your recent searches",
    headline: "Black Highlander $3,500 over stated budget",
    imageUrl: "/editorial-card/image-three.png",
    href: "/search?model=highlander&color=black",
  },
];
