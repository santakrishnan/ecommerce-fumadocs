import "server-only";

import { env } from "@config/env";
import { FingerprintJsServerApiClient, Region } from "@fingerprintjs/fingerprintjs-pro-server-api";
import { createLogger } from "@shared/lib/logger";

const log = createLogger("fingerprint:geo");

/** Trimmed geo payload we persist (sealed cookie) and derive the response from. */
export interface FingerprintGeoData {
  city?: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  timezone?: string;
}

/** Result of resolving a Fingerprint event: verified identity + geo. */
export interface FingerprintEventData {
  geo: FingerprintGeoData | null;
  /** Server-verified visitor id from the identification product. */
  visitorId?: string;
}

function resolveRegion(region: string | undefined): Region {
  switch (region?.toLowerCase()) {
    case "eu":
      return Region.EU;
    case "ap":
      return Region.AP;
    default:
      return Region.Global;
  }
}

/**
 * Resolve the Fingerprint Server API event for a `requestId`, returning the
 * **server-verified** `visitorId` (from the identification product) plus IP geo.
 *
 * Returns `{ visitorId: undefined, geo: null }` on any failure — the event is
 * non-critical and must never throw to the enrich endpoint.
 */
export async function getFingerprintEvent(requestId: string): Promise<FingerprintEventData> {
  const apiKey = env.FINGERPRINT_API_KEY;

  if (!apiKey) {
    log.warn("FINGERPRINT_API_KEY not set, skipping event lookup");
    return { geo: null };
  }

  try {
    const client = new FingerprintJsServerApiClient({
      apiKey,
      region: resolveRegion(env.FINGERPRINT_REGION),
    });

    const event = await client.getEvent(requestId);

    // Verified identity — the authoritative visitor id for this request.
    const visitorId = event.products?.identification?.data?.visitorId;

    const ipData = event.products?.ipInfo?.data;
    const ipVersion = ipData?.v4 ?? ipData?.v6;
    const rawGeo = ipVersion?.geolocation;

    const geo: FingerprintGeoData | null = rawGeo
      ? {
          postalCode: rawGeo.postalCode,
          latitude: rawGeo.latitude,
          longitude: rawGeo.longitude,
          city: rawGeo.city?.name,
          countryCode: rawGeo.country?.code,
          countryName: rawGeo.country?.name,
          timezone: rawGeo.timezone,
        }
      : null;

    return { visitorId, geo };
  } catch (err) {
    log.warn("event lookup error", {
      requestId,
      reason: err instanceof Error ? err.message : "unknown",
    });
    return { geo: null };
  }
}
