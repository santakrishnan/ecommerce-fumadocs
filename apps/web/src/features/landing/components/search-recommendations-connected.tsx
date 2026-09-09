"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the Search Recommendations section.
 *
 * SearchRecommendationsClient reads the TanStack DB bookmarked-vehicles
 * collection via `useLiveQuery`, which has no server snapshot — so it's
 * loaded with `ssr: false` (only supported inside a Client Component).
 */
const SearchRecommendationsDynamic = dynamic(
  () => import("./search-recommendations-client").then((m) => m.SearchRecommendationsClient),
  { ssr: false }
);

export function SearchRecommendationsConnected() {
  return <SearchRecommendationsDynamic />;
}
