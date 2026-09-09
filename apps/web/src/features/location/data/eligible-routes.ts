import { ROUTES } from "@config/routes/constants";

/**
 * Routes eligible for query invalidation when location changes.
 *
 * When the user updates their zip code, only pages that depend on
 * location-based data should refetch. Other pages just update the
 * LocationPill display without triggering refetches.
 */
export const ELIGIBLE_ROUTES: string[] = [ROUTES.HOME, ROUTES.WELCOME, ROUTES.SEARCH];

/**
 * Query keys that should be invalidated on eligible routes
 * when location changes. These represent data that depends on
 * geographic coordinates (inventory, pricing, dealers).
 */
export const LOCATION_DEPENDENT_QUERY_KEYS: string[][] = [
  ["dealer-offers"],
  ["nearby-vehicles"],
  ["featured-vehicles"],
  ["editorial-cards"],
  ["personalized-search"],
  ["rare-finds"],
  // Prefix-matches ["search-results", searchId, …] so page turns refetch.
  ["search-results"],
  // Fingerprint session caches zip + coordinates with a 5min staleTime.
  // Invalidating forces a refetch that picks up the new geo cookies.
  ["fingerprint", "session"],
];
