import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { FromZipRequest } from "../contracts/from-zip-request.schema";
import type { FromZipResponse } from "../contracts/from-zip-response.schema";
import { createGeoError, type GeoError } from "../errors/geo.errors";
import { mockGeoFromZip } from "../services/geo-from-zip-mock";
import { fetchGeoFromZipCached } from "../services/geo-from-zip-upstream";

export type GetGeoFromZipResult =
  | { success: true; data: FromZipResponse }
  | { success: false; error: GeoError };

/**
 * Use case: resolve visitor's geo location from a zip code.
 *
 * Routing precedence (matches BED-migrated services):
 * 1. USE_GEO_MOCKS=true → mock (override wins, for local dev)
 * 2. API_UPSTREAM_URL + GEO_API_KEY both set → real BED geo service
 * 3. Otherwise → 503 (surfaces misconfiguration)
 */
export async function getGeoFromZip(request: FromZipRequest): Promise<GetGeoFromZipResult> {
  if (env.USE_GEO_MOCKS === "true") {
    const data = await mockGeoFromZip(request);
    return { success: true, data };
  }

  const service = resolveBedService("geo");
  if (service) {
    return fetchGeoFromZipCached(service.baseUrl, request);
  }

  return {
    success: false,
    error: createGeoError(
      "GEO_UPSTREAM_UNAVAILABLE",
      "Geo service is not configured (API_UPSTREAM_URL or GEO_API_KEY missing) and USE_GEO_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
