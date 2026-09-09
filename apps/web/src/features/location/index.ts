// Public API for the location feature.
// Server-only modules (cookie writes, the cookie-reading LocationPillWrapper)
// are exported from ./server instead — this barrel must stay safe to import
// from Client Components.

export { LocationPill, type LocationPillProps } from "./components/location-pill";
export { LocationPillSkeleton } from "./components/location-pill-skeleton";
export { LocationRehydrator } from "./components/location-rehydrator";
export { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "./data/constants";
export { ELIGIBLE_ROUTES, LOCATION_DEPENDENT_QUERY_KEYS } from "./data/eligible-routes";
export { useLocationRehydration } from "./hooks/use-location-rehydration";
