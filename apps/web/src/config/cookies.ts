import type { CookieConfig } from "@shared/lib/http";
import { LOCATION_COOKIE, LOCATION_TTL } from "@ucmp/shared/constants";

const isProduction = process.env.NODE_ENV === "production";

function getCookieName(baseName: string): string {
  return isProduction ? `__Host-${baseName}` : baseName;
}

export const locationCookieNames = {
  ZIP: getCookieName(LOCATION_COOKIE.ZIP),
  GEO: getCookieName(LOCATION_COOKIE.GEO),
} as const;

/**
 * Options for the ZIP display cookie.
 * - Not HttpOnly: the value is a non-sensitive display preference.
 * - SameSite Lax: compatible with normal page navigation.
 */
export const zipCookieOptions: CookieConfig = {
  httpOnly: false,
  name: locationCookieNames.ZIP,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: LOCATION_TTL.PREFERENCE,
};

/**
 * Options for the coordinates cookie.
 * - HttpOnly: raw coordinates never reach client JavaScript.
 * - SameSite Strict: never sent on cross-site requests.
 */
export const geoCookieOptions: CookieConfig = {
  httpOnly: true,
  name: locationCookieNames.GEO,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: LOCATION_TTL.PREFERENCE,
};
