import cardDemo from "@public/editorial-card/card-demo.png";
import imgOne from "@public/editorial-card/img-one.png";
import imgThree from "@public/editorial-card/img-three.png";
import type { LinkEditorialCardProps } from "@shared/components/editorial-card";

/** Serializable icon identifiers — resolved to components in the client carousel. */
export type EditorialIconName = "bolt" | "binocular" | "location";

export type EditorialCardData = Omit<LinkEditorialCardProps, "icon" | "size" | "onClick"> & {
  /** Optional icon name — resolved to the actual component in the carousel. */
  iconName?: EditorialIconName;
  /**
   * When present, clicking this card pre-seeds a queued turn in IDB before
   * navigation. Mirrors the NextSearchPlan shape from the search API spec.
   * `searchId` becomes the route param; `query` is submitted automatically
   * by the orchestrator on mount.
   */
  nextSearchPlan?: {
    searchId: string;
    query?: string;
  };
};

// TODO: replace with real personalization API once endpoint exists
export const PERSONALIZED_SEARCH_CARDS_SEED: EditorialCardData[] = [
  {
    nextSearchPlan: {
      searchId: "b1a2c3d4-e5f6-4890-abcd-ef1234567890",
      query: "A fuel efficient SUV for city driving and weekend trips for under $30,000",
    },
    eyebrow: "Continue searching",
    headline: "A fuel efficient SUV for city driving and weekend trips for under $30,000",
    href: "/search/b1a2c3d4-e5f6-4890-abcd-ef1234567890",
    imageUrl: imgOne.src,
    matches: 3,
    surface: "dark",
  },
  {
    nextSearchPlan: {
      searchId: "c2b3d4e5-f6a7-4901-bcde-f12345678901",
    },
    eyebrow: "Continue searching",
    headline: "A reliable, family friendly car that gets good gas mileage in white or grey",
    href: "/search/c2b3d4e5-f6a7-4901-bcde-f12345678901",
    imageUrl: cardDemo.src,
    matches: 2,
    surface: "light",
  },
  {
    eyebrow: "Perfect for city driving",
    headline: "Fuel efficient hybrids and electric SUVs",
    href: "/search/d4e5f6a7-3333-4000-8000-000000000003",
    iconName: "bolt",
    imageUrl: imgThree.src,
    matches: 6,
    surface: "light",
  },
];
