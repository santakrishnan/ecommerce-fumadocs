import { isValidVin } from "utils/validators";

/**
 * Centralised route constants.
 * Update this single file whenever you add a top-level route.
 */

const VDP_BASE = "/used-cars/details" as const;

/** Placeholder for the optional trim segment when none is provided. */
const VDP_TRIM_FALLBACK = "-";

export interface VdpPathParams {
  make: string;
  model: string;
  /** Optional — an empty, whitespace, or missing trim renders as "-" in the path. */
  trim?: string;
  vin: string;
  year: number | string;
}

/**
 * Whether (possibly partial) params can form a valid VDP path. `trim` is
 * intentionally not required (it falls back to "-"). Doubles as a type guard so
 * `vdp()` and `vdpSafe()` share one source of truth and can never disagree on
 * what's valid.
 */
function canBuildVdp(params: Partial<VdpPathParams>): params is VdpPathParams {
  const { make, model, vin, year } = params;
  return Boolean(make && model && vin && year) && isValidVin(vin ?? "");
}

/** Slugify a segment for SEO-friendly URLs: lowercase, hyphens for spaces/special chars. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** Assemble the canonical path. Assumes params have already been validated. */
function buildVdpPath({ make, model, trim, year, vin }: VdpPathParams): string {
  const resolvedTrim = trim?.trim() || VDP_TRIM_FALLBACK;
  const segments = [
    slugify(make),
    slugify(model),
    slugify(resolvedTrim),
    String(year),
    vin.toUpperCase(),
  ].join("/");
  return `${VDP_BASE}/${segments}`;
}

/**
 * Build the canonical VDP path `/used-cars/details/{make}/{model}/{trim}/{year}/{vin}`.
 *
 * Strict variant — throws if make/model/year are empty or the VIN fails the ISO 3779
 * character/length check; catching bad data at the call site beats a 404 in prod.
 * `trim` is optional and substituted with "-" when empty or missing.
 */
export function vdp(params: VdpPathParams): string {
  const { vin } = params;
  if (!canBuildVdp(params)) {
    throw new Error(`vdp(): make, model, and a valid 17-char VIN are required (vin: "${vin}")`);
  }
  return buildVdpPath(params);
}

/**
 * Non-throwing companion to `vdp()` — accepts loose/partial data and returns
 * `null` instead of throwing when the params can't form a valid path. Use at
 * render sites that want a graceful fallback, e.g. `ROUTES.vdpSafe(vehicle) ?? "/"`.
 */
export function vdpSafe(params: Partial<VdpPathParams>): string | null {
  return canBuildVdp(params) ? buildVdpPath(params) : null;
}

export const ROUTES = {
  HOME: "/",
  WELCOME: "/welcome-back",
  ABOUT: "/about",
  DEALERS: "/dealers",
  SEARCH_CAR: "/search?type=car",
  SEARCH_TRUCK: "/search?type=truck",
  SEARCH_SUV: "/search?type=suv",
  SEARCH_ELECTRIC: "/search?type=electric",
  SEARCH: "/search",
  /** Vehicle comparison page (side-by-side compare experience). */
  WATCHLIST: "/profile/watchlist",
  // Add more route constants here as your app grows.
  SAVED: "/saved",
  PROFILE: "/profile",
  PRIVACY: "/privacy",
  /** Build a search-results URL keyed by the backend-issued UUID. */
  searchResults: (id: string) => `/search/${encodeURIComponent(id)}` as const,
  searchResultsAll: (id: string) => `/search/${encodeURIComponent(id)}/results` as const,
  /** Build a canonical VDP path. See `vdp()` for validation. */
  vdp,
  /** Non-throwing VDP path builder — returns null on invalid params. */
  vdpSafe,
  /** Placeholder purchase entry URL — swap when the real flow is confirmed. */
  PURCHASE: "/purchase" as const,
  /** Build a purchase-flow deep-link from a vehicle VIN. */
  purchase: (vin: string) => `/purchase/${encodeURIComponent(vin)}` as const,
} as const;

export type RoutePath = string;

/**
 * Internal API route paths.
 * Used by client-side services to call BFF endpoints.
 */
export const API_ROUTES = {
  PROFILE_RESOLVE: "/api/v1/profile/resolve",
  GEO_FROM_ZIP: "/api/v1/geo/from-zip",
  WATCHLIST: "/api/v1/profile/watchlist",
  watchlistByVin: (vin: string) => `/api/v1/profile/watchlist/${encodeURIComponent(vin)}`,
  SEARCHES: "/api/v1/profile/searches",
  searchesById: (searchId: string) => `/api/v1/profile/searches/${encodeURIComponent(searchId)}`,
  ACTIVITIES: "/api/v1/profile/activities",
  PREFERENCES: "/api/v1/profile/preferences",
  preferencesBySearchId: (searchId: string) =>
    `/api/v1/profile/preferences/search/${encodeURIComponent(searchId)}`,
} as const;
