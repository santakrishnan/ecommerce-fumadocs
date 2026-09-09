import "server-only";

import { geoCookieOptions, locationCookieNames, zipCookieOptions } from "@config/cookies";
import { cookies } from "next/headers";

/**
 * Single write path for the location cookie pair.
 *
 * Every server-side writer (fingerprint enrichment, ZIP-change Server
 * Actions) goes through `writeLocationCookies` so that:
 * - ZIP and GEO are always written together — they can never diverge.
 * - GEO has exactly one format: `"<lat>,<lng>"` truncated to 3 decimals.
 * - Precedence is enforced at the cookie layer: fingerprint may only seed a
 *   missing location; a manual override always wins until explicitly cleared.
 */

export interface LocationCookieWrite {
  latitude: number;
  longitude: number;
  /**
   * "fingerprint" — initial seed; skipped when a ZIP cookie already exists
   * (never clobbers a manual override).
   * "manual" — user override; always overwrites.
   */
  source: "fingerprint" | "manual";
  zip: string;
}

/** Rounds a coordinate to 3 decimal places (~100 m radius, per privacy ADR). */
export function truncateCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Serializes truncated coordinates into the canonical GEO cookie format. */
export function serializeGeo(latitude: number, longitude: number): string {
  return `${truncateCoord(latitude)},${truncateCoord(longitude)}`;
}

/** Parses the GEO cookie value; returns null for missing/malformed values. */
export function parseGeoCookie(
  value: string | undefined
): { latitude: number; longitude: number } | null {
  if (!value) {
    return null;
  }
  const parts = value.split(",");
  if (parts.length !== 2) {
    return null;
  }
  const [latRaw, lngRaw] = parts;
  if (!(latRaw && lngRaw)) {
    return null;
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!(Number.isFinite(lat) && Number.isFinite(lng))) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}

/**
 * Writes the ZIP + GEO cookie pair atomically.
 *
 * Returns `true` when the cookies were written, `false` when a
 * `"fingerprint"` write was skipped because a location already exists.
 */
export async function writeLocationCookies({
  zip,
  latitude,
  longitude,
  source,
}: LocationCookieWrite): Promise<boolean> {
  const cookieStore = await cookies();

  if (source === "fingerprint" && cookieStore.has(locationCookieNames.ZIP)) {
    return false;
  }

  cookieStore.set(locationCookieNames.ZIP, zip, zipCookieOptions);
  cookieStore.set(locationCookieNames.GEO, serializeGeo(latitude, longitude), geoCookieOptions);
  return true;
}

/** Visitor location resolved from the ZIP + GEO cookies (all fields optional). */
export interface ResolvedLocationCookies {
  latitude?: number;
  longitude?: number;
  zipCode?: string;
}

/**
 * Reads the visitor's location from the ZIP + GEO cookies, server-side.
 *
 * The GEO (coordinates) cookie is HttpOnly, so this is the only way to read the
 * real coordinates. Returns only the fields present — `{}` when no cookies exist.
 */
export async function readLocationFromCookies(): Promise<ResolvedLocationCookies> {
  const cookieStore = await cookies();
  const zip = cookieStore.get(locationCookieNames.ZIP)?.value || undefined;
  const coords = parseGeoCookie(cookieStore.get(locationCookieNames.GEO)?.value);

  return {
    ...(zip ? { zipCode: zip } : {}),
    ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
  };
}
