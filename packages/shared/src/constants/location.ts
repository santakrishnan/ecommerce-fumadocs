/**
 * Location cookie constants — names, defaults, and TTL.
 *
 * Kept in @ucmp/shared so proxy.ts, Server Actions, and any server-side
 * consumer all reference the same strings. Changing a cookie name is a
 * one-file edit.
 *
 * Prefix `_ucmp_` matches the tracking cookie convention so all first-party
 * cookies are grep-friendly and don't collide with third-party cookies.
 */

export const LOCATION_COOKIE = {
  /** 5-digit US ZIP code. Not HttpOnly — intentionally readable by client JS as a display preference. */
  ZIP: "_ucmp_zip",
  /**
   * Coordinates serialized as "<lat>,<lng>" truncated to 3 decimal places
   * (~100 m radius). HttpOnly — never exposed to client JS.
   */
  GEO: "_ucmp_geo",
} as const;

/** Default location — Beverly Hills, CA (90210). */
export const LOCATION_DEFAULTS = {
  ZIP: "90210",
  /** Truncated to 3 decimal places to avoid unnecessary precision. */
  LAT: 34.074,
  LNG: -118.4,
  /** Pre-serialized value written to the GEO cookie. */
  GEO: "34.074,-118.4",
} as const;

/** TTL in **seconds** (Set-Cookie Max-Age convention). */
export const LOCATION_TTL = {
  /** 1 year — refreshed on every location update. */
  PREFERENCE: 365 * 86_400,
} as const;

export type LocationCookieName = (typeof LOCATION_COOKIE)[keyof typeof LOCATION_COOKIE];
