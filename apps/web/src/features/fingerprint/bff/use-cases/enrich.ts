import "server-only";

import { locationCookieNames } from "@config/cookies";
import { env } from "@config/env";
import { writeLocationCookies } from "@features/location/server";
import { TRACKING_TTL } from "@ucmp/shared/constants";
import { cookies } from "next/headers";
import { FINGERPRINT_ID_COOKIE } from "../../constants";
import type { EnrichResponse } from "../contracts/enrich.schema";
import { encodeVisitorId } from "../fingerprint-cookie";
import { getFingerprintEvent } from "../services/fingerprint-geo";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Parses the DEV_SEED_LOCATION env var (format: "ZIP,LATITUDE,LONGITUDE").
 * Returns null if unset, empty, or malformed — callers fall back to real geo.
 */
function parseDevSeedLocation(): { zip: string; latitude: number; longitude: number } | null {
  const raw = env.DEV_SEED_LOCATION?.trim();
  if (!raw) {
    return null;
  }

  const [zip, lat, lng] = raw.split(",");
  if (!(zip && lat && lng)) {
    return null;
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!(Number.isFinite(latitude) && Number.isFinite(longitude))) {
    return null;
  }

  return { zip, latitude, longitude };
}

/**
 * Fingerprint enrichment use-case (cold path).
 *
 * Resolves the Fingerprint event for a `requestId`, then **server-side**:
 *  - writes the server-verified `visitorId` into an httpOnly `_ucmp_fp_id`
 *    cookie — set/read only server-side, never exposed to client JS,
 *  - seeds the ZIP + GEO location cookies via the shared atomic writer.
 *    Fingerprint is a *seed only*: when a location already exists (e.g. a
 *    manual ZIP override), the write is skipped and the existing value wins,
 *  - returns `{ visitorId, zip, coordinates }` for the client context.
 *
 * No Visitor Profile Service involvement; no client cookie writes.
 */
export async function enrichFingerprint(requestId: string): Promise<EnrichResponse> {
  const { visitorId, geo } = await getFingerprintEvent(requestId);
  const cookieStore = await cookies();

  // Verified id → httpOnly, server-only cookie (never read/written by client JS).
  if (visitorId) {
    cookieStore.set(FINGERPRINT_ID_COOKIE, encodeVisitorId(visitorId), {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: TRACKING_TTL.FINGERPRINT,
    });
  }

  let zip = geo?.postalCode;

  // Dev seed override: when DEV_SEED_LOCATION is set, use those values instead
  // of the real fingerprint geo result. The source stays "fingerprint" so manual
  // ZIP changes (source: "manual") still win via the existing precedence logic.
  const devOverride = parseDevSeedLocation();
  const seedZip = devOverride?.zip ?? geo?.postalCode;
  const seedLat = devOverride?.latitude ?? geo?.latitude;
  const seedLng = devOverride?.longitude ?? geo?.longitude;

  // Location cookies are written together or not at all — a partial geo
  // (missing postal code or coordinates) seeds nothing.
  if (seedZip && seedLat != null && seedLng != null) {
    const written = await writeLocationCookies({
      zip: seedZip,
      latitude: seedLat,
      longitude: seedLng,
      source: "fingerprint",
    });

    zip = seedZip;

    // Seed skipped → an override already exists; report the cookie value so
    // the client context converges on the winning location, not the
    // fingerprint one.
    if (!written) {
      zip = cookieStore.get(locationCookieNames.ZIP)?.value ?? zip;
    }
  }

  const coordinates =
    seedLat != null && seedLng != null ? { lat: seedLat, lng: seedLng } : undefined;

  return { visitorId, zip, coordinates };
}
