// Server-only public surface for the location feature.
//
// Split from index.ts because these modules import "server-only" or
// next/headers — pulling them through the universal barrel would break
// client consumers of LOCATION_QUERY_KEY / LocationPill / LocationRehydrator.

export { LocationPillWrapper } from "./components/location-pill-wrapper";
export type { LocationCookieWrite, ResolvedLocationCookies } from "./lib/location-cookies";
export {
  parseGeoCookie,
  readLocationFromCookies,
  serializeGeo,
  truncateCoord,
  writeLocationCookies,
} from "./lib/location-cookies";
