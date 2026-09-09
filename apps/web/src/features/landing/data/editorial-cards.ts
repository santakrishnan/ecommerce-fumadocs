import carousel1 from "@public/editorial-card/carousel1.png";
import carousel2 from "@public/editorial-card/carousel2.png";
import carousel3 from "@public/editorial-card/carousel3.png";
import carousel4 from "@public/editorial-card/carousel4.png";
import type { LinkEditorialCardProps } from "@shared/components/editorial-card";

/** Serializable icon identifiers — resolved to components in the client carousel. */
export type EditorialIconName = "bolt" | "binocular" | "location";

export type EditorialCardData = Omit<LinkEditorialCardProps, "icon" | "size"> & {
  /** Optional icon name — resolved to the actual component in the carousel. */
  iconName?: EditorialIconName;
};

// TODO: replace with real upstream once /editorial-cards endpoint exists
export const EDITORIAL_CARDS_SEED: EditorialCardData[] = [
  {
    eyebrow: "Trending near you",
    headline: "Our most popular models in Greater LA",
    href: "/search/a1b2c3d4-1111-4000-8000-000000000001",
    iconName: "location",
    imageUrl: carousel2.src,
    matches: 9,
    surface: "dark",
  },
  {
    eyebrow: "Based on your search for a Family SUV",
    headline: "Family friendly SUVs with top rated safety",
    href: "/search/a1b2c3d4-2222-4000-8000-000000000002",
    imageUrl: carousel1.src,
    matches: 5,
    surface: "dark",
  },
  {
    eyebrow: "Get ready to purchase",
    headline: "Apply a trade-in to your next purchase",
    href: "/search/a1b2c3d4-3333-4000-8000-000000000003",
    iconName: "bolt",
    imageUrl: carousel4.src,
    matches: 2,
    surface: "dark",
  },
  {
    eyebrow: "Perfect for city driving",
    headline: "Fuel efficient hybrids and EVs",
    href: "/search/a1b2c3d4-4444-4000-8000-000000000004",
    iconName: "bolt",
    imageUrl: carousel3.src,
    matches: 10,
    surface: "dark",
  },
];
