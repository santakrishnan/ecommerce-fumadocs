"use server";

import { getGeoFromCoords, getGeoFromZip } from "@features/geo/bff";
import type { GeoErrorCode } from "@features/geo/bff/errors/geo.errors";
import { z } from "zod";
import { truncateCoord, writeLocationCookies } from "../lib/location-cookies";

// ---------------------------------------------------------------------------
// User-facing error messages (never expose internal details)
// ---------------------------------------------------------------------------

const USER_FACING_ERRORS: Record<GeoErrorCode, string> = {
  GEO_UPSTREAM_UNAVAILABLE: "Location service is temporarily unavailable. Please try again later.",
  GEO_UPSTREAM_ERROR: "We couldn't look up that location. Please try again.",
  GEO_VALIDATION_FAILED: "We couldn't find a valid location for the input provided.",
  GEO_INTERNAL_ERROR: "Something went wrong. Please try again.",
};

/** Maps a GeoError code to a safe, user-friendly message. */
function toUserFacingError(code: GeoErrorCode): string {
  return USER_FACING_ERRORS[code] ?? USER_FACING_ERRORS.GEO_INTERNAL_ERROR;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const zipSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "ZIP code must be exactly 5 digits.");

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export type LocationActionResult =
  | { success: true; zip: string; city: string; stateCode: string }
  | { success: false; error: string };

/**
 * Updates the location cookies from a manually entered ZIP code.
 *
 * Flow: validate ZIP → resolve geo via the BFF use case (in-process, cached)
 * → write ZIP + GEO cookies atomically → return the resolved location so the
 * client can reset its context without waiting for a refresh.
 *
 * A failed lookup writes no cookies and changes no state.
 */
export async function updateZipCode(zip: string): Promise<LocationActionResult> {
  const parsed = zipSchema.safeParse(zip);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid ZIP code." };
  }

  const geo = await getGeoFromZip({ zip: parsed.data });
  if (!geo.success) {
    return { success: false, error: toUserFacingError(geo.error.code) };
  }

  await writeLocationCookies({
    zip: geo.data.zip,
    latitude: geo.data.latitude,
    longitude: geo.data.longitude,
    source: "manual",
  });

  return {
    success: true,
    zip: geo.data.zip,
    city: geo.data.city,
    stateCode: geo.data.stateCode,
  };
}

/**
 * Updates the location cookies from browser geolocation coordinates.
 *
 * Flow: validate coords → truncate to 3 decimals (raw precision from
 * `navigator.geolocation` never leaves this function) → reverse-resolve via
 * the BFF use case → write ZIP + GEO cookies atomically → return the
 * resolved location.
 */
export async function updateLocationFromCoords(
  lat: number,
  lng: number
): Promise<LocationActionResult> {
  const parsed = coordsSchema.safeParse({ lat, lng });
  if (!parsed.success) {
    return { success: false, error: "Invalid coordinates." };
  }

  const latitude = truncateCoord(parsed.data.lat);
  const longitude = truncateCoord(parsed.data.lng);

  const geo = await getGeoFromCoords({ latitude, longitude });
  if (!geo.success) {
    return { success: false, error: toUserFacingError(geo.error.code) };
  }

  await writeLocationCookies({
    zip: geo.data.zip,
    latitude,
    longitude,
    source: "manual",
  });

  return {
    success: true,
    zip: geo.data.zip,
    city: geo.data.city,
    stateCode: geo.data.stateCode,
  };
}
