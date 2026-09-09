import "server-only";

import { env } from "@config/env";
import type { CompositionV3 } from "@ucmp/vehicle-360";

const CAR_CUTTER_CDN_BASE = "https://cdn.car-cutter.com/gallery";

/**
 * Fetches the Car-Cutter composition_v3.json manifest for a given VIN directly
 * from the CDN (server-to-CDN, no internal HTTP hop through the /360 route handler).
 *
 * Returns null when:
 * - CAR_CUTTER_GALLERY_HASH env var is not configured
 * - CDN returns a non-2xx response (e.g. 404 — no data for this VIN)
 * - Fetch times out or throws
 *
 * Note: USE_VDP_MOCKS only affects the BFF vehicle lookup, not CDN manifest
 * fetches. The manifest is always requested for the actual VIN being viewed so
 * the gallery shows real Car-Cutter data whenever it exists.
 *
 * Caching: `next: { revalidate: 3600 }` stores the result in Next.js's Data
 * Cache keyed by the full CDN URL. Both this SSR call (VDP page render) and the
 * client-side Route Handler call (`/api/v1/vehicles/[vin]/360` → Vehicle360Viewer)
 * resolve to the same cache entry, so at most ONE real CDN round-trip occurs per
 * VIN per hour regardless of how many times the manifest is requested within that
 * window.
 */
export async function fetchCarCutterManifest(vin: string): Promise<CompositionV3 | null> {
  const galleryHash = env.CAR_CUTTER_GALLERY_HASH;
  if (!galleryHash) {
    return null;
  }

  const manifestUrl = `${CAR_CUTTER_CDN_BASE}/${galleryHash}/${encodeURIComponent(vin.toUpperCase())}/composition_v3.json`;

  try {
    const res = await fetch(manifestUrl, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as CompositionV3;
  } catch {
    return null;
  }
}
