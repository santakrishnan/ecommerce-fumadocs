import { IMAGE_BASE_URL } from "@config/images";
import type {
  SearchRecentResponse,
  SearchRecentUpstreamResponse,
} from "../contracts/search-recent-response.schema";

/** Validated client-facing suggestion card fixtures. */
export const SEARCH_RECENT_FIXTURE: SearchRecentResponse = [
  {
    imageUrl: "/editorial-card/carousel2.png",
    imageAlt: "A fuel efficient SUV for city driving and weekend trips for under $30,000",
    headline: "A fuel efficient SUV for city driving and weekend trips for under $30,000",
    eyebrow: "Continue searching",
    ctaLink: `${IMAGE_BASE_URL}/search/a1b2c3d4-1111-4000-8000-000000000001`,
    matches: 9,
    surface: "dark",
  },
  {
    imageUrl: "/editorial-card/carousel1.png",
    imageAlt: "A reliable, family friendly car that gets good gas milage in white or grey",
    headline: "A reliable, family friendly car that gets good gas milage in white or grey",
    eyebrow: "Based on your search for a Family SUV",
    ctaLink: `${IMAGE_BASE_URL}/search/a1b2c3d4-2222-4000-8000-000000000002`,
    matches: 5,
    surface: "dark",
  },
  {
    imageUrl: "/editorial-card/img-one.png",
    imageAlt: "Fuel efficient hybrids and electric SUVs",
    headline: "Fuel efficient hybrids and electric SUVs",
    eyebrow: "Perfect for city driving",
    ctaLink: `${IMAGE_BASE_URL}/search/a1b2c3d4-3333-4000-8000-000000000003`,
    matches: 12,
    surface: "dark",
  },
];

/** Raw upstream response shape for testing mappers. */
export const SEARCH_RECENT_UPSTREAM_FIXTURE: SearchRecentUpstreamResponse = [
  {
    imageUrl: "/editorial-card/carousel2.png",
    imageAlt: "Our most popular models in Greater LA",
    headline: "Our most popular models in Greater LA",
    eyebrow: "Trending near you",
    ctaLink: "/search/a1b2c3d4-4444-4000-8000-000000000004",
    surface: "light",
  },
  {
    imageUrl: "/editorial-card/carousel1.png",
    imageAlt: "Family friendly SUVs with top rated safety",
    headline: "Family friendly SUVs with top rated safety",
    eyebrow: "Based on your search for a Family SUV",
    ctaLink: "/search/a1b2c3d4-5555-4000-8000-000000000005",
    surface: "dark",
  },
  {
    imageUrl: "/editorial-card/img-one.png",
    imageAlt: "A fuel efficient SUV for city driving and weekend trips",
    headline: "A fuel efficient SUV for city driving and weekend trips for under $30,000",
    eyebrow: "Continue searching",
    ctaLink: "/search/a1b2c3d4-6666-4000-8000-000000000006",
    surface: "dark",
  },
];
