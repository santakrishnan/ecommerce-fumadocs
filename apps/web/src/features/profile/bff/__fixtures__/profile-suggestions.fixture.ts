import type {
  ProfileSuggestionsResponse,
  ProfileSuggestionsUpstreamResponse,
} from "../contracts/profile-suggestions-response.schema";

/** Validated client-facing suggestion card fixtures. */
export const PROFILE_SUGGESTIONS_FIXTURE: ProfileSuggestionsResponse = [
  {
    eyebrow: "Trending near you",
    headline: "Our most popular models in Greater LA",
    href: "/search/a1b2c3d4-1111-4000-8000-000000000001",
    iconName: "location",
    imageUrl: "/editorial-card/carousel2.png",
    matches: 9,
    surface: "light",
  },
  {
    eyebrow: "Based on your search for a Family SUV",
    headline: "Family friendly SUVs with top rated safety",
    href: "/search/a1b2c3d4-2222-4000-8000-000000000002",
    imageUrl: "/editorial-card/carousel1.png",
    matches: 5,
    surface: "dark",
  },
  {
    eyebrow: "Get ready to purchase",
    headline: "Apply a trade-in to your next purchase",
    href: "/search/a1b2c3d4-3333-4000-8000-000000000003",
    iconName: "bolt",
    imageUrl: "/editorial-card/carousel4.png",
    surface: "dark",
  },
  {
    eyebrow: "Perfect for city driving",
    headline: "Fuel efficient hybrids and EVs",
    href: "/search/a1b2c3d4-4444-4000-8000-000000000004",
    iconName: "bolt",
    imageUrl: "/editorial-card/carousel3.png",
    matches: 10,
    surface: "dark",
  },
];

/** Raw upstream response shape for testing mappers. */
export const PROFILE_SUGGESTIONS_UPSTREAM_FIXTURE: ProfileSuggestionsUpstreamResponse = [
  {
    eyebrow: "Trending near you",
    headline: "Our most popular models in Greater LA",
    href: "/search/a1b2c3d4-1111-4000-8000-000000000001",
    iconName: "location",
    imageUrl: "/editorial-card/carousel2.png",
    matches: 9,
    surface: "light",
  },
  {
    eyebrow: "Based on your search for a Family SUV",
    headline: "Family friendly SUVs with top rated safety",
    href: "/search/a1b2c3d4-2222-4000-8000-000000000002",
    imageUrl: "/editorial-card/carousel1.png",
    matches: 5,
    surface: "dark",
  },
  {
    eyebrow: "Get ready to purchase",
    headline: "Apply a trade-in to your next purchase",
    href: "/search/a1b2c3d4-3333-4000-8000-000000000003",
    iconName: "bolt",
    imageUrl: "/editorial-card/carousel4.png",
    surface: "dark",
  },
  {
    eyebrow: "Perfect for city driving",
    headline: "Fuel efficient hybrids and EVs",
    href: "/search/a1b2c3d4-4444-4000-8000-000000000004",
    iconName: "bolt",
    imageUrl: "/editorial-card/carousel3.png",
    matches: 10,
    surface: "dark",
  },
];
