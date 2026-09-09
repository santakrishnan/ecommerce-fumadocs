import "server-only";

import { LOCATION_DEFAULTS } from "@ucmp/shared/constants";
import { env } from "./env";

/**
 * App-level location defaults — reads `DEV_SEED_LOCATION` from the validated
 * env schema and falls back to the shared static constants.
 *
 * Server-only: client code should import `DEFAULT_ZIP_CODE` from `@features/location`.
 */
const ZIP_PATTERN = /^\d{5}$/;

function resolveLocationDefaults(): { zip: string; lat: number; lng: number } {
  const seed = env.DEV_SEED_LOCATION?.trim();
  if (seed) {
    const [rawZip, rawLat, rawLng] = seed.split(",");
    const zip = rawZip?.trim();
    const lat = Number(rawLat?.trim());
    const lng = Number(rawLng?.trim());

    if (
      zip &&
      ZIP_PATTERN.test(zip) &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { zip, lat, lng };
    }
  }
  return { zip: LOCATION_DEFAULTS.ZIP, lat: LOCATION_DEFAULTS.LAT, lng: LOCATION_DEFAULTS.LNG };
}

export const APP_LOCATION_DEFAULTS = resolveLocationDefaults();
