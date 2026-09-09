import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { cacheLife, cacheTag } from "next/cache";
import type { FromCoordsRequest } from "../contracts/from-coords-request.schema";
import type { FromZipResponse } from "../contracts/from-zip-response.schema";
import {
  fromZipResponseSchema,
  fromZipUpstreamEnvelopeSchema,
} from "../contracts/from-zip-response.schema";
import { createGeoError, type GeoError, mapCaughtToGeoError } from "../errors/geo.errors";
import { mapFromZipUpstreamToResponse } from "../mappers/from-zip.mapper";
import { createGeoClient } from "./geo-client";

type FetchGeoFromCoordsResult =
  | { success: true; data: FromZipResponse }
  | { success: false; error: GeoError };

/**
 * Calls the external backend's /geo/v1/fromCoords endpoint and maps the response.
 * Upstream returns the same shape as /geo/v1/fromZip, so the fromZip contract
 * and mapper are reused.
 */
async function fetchGeoFromCoords(
  baseUrl: string,
  request: FromCoordsRequest
): Promise<FetchGeoFromCoordsResult> {
  const client = createGeoClient(baseUrl);

  try {
    const raw = await client.get("/fromCoords", {
      params: { latitude: String(request.latitude), longitude: String(request.longitude) },
    });

    const envelope = fromZipUpstreamEnvelopeSchema.safeParse(raw);
    if (!envelope.success) {
      return {
        success: false,
        error: createGeoError(
          "GEO_UPSTREAM_ERROR",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const mapped = mapFromZipUpstreamToResponse(envelope.data.data);
    const validated = fromZipResponseSchema.safeParse(mapped);

    if (!validated.success) {
      return {
        success: false,
        error: createGeoError(
          "GEO_UPSTREAM_ERROR",
          "Mapped response violates the BFF response contract",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error) {
    return { success: false, error: mapCaughtToGeoError(error) };
  }
}

/**
 * Cached wrapper around the upstream geo fromCoords call.
 * Uses the "landing" cache profile (15 min stale, 15 min revalidate, 1 hr expire).
 *
 * Coordinates are truncated to 3 decimals by the caller (~100 m), so the
 * cache key space stays bounded. Only non-secret primitives (`baseUrl`,
 * coordinates) are passed in — auth headers are read from `process.env` at
 * request time inside `createGeoClient`.
 *
 * Tagged with `geo-from-coords` for on-demand revalidation via `/api/v1/revalidate`.
 */
export async function fetchGeoFromCoordsCached(
  baseUrl: string,
  request: FromCoordsRequest
): Promise<FetchGeoFromCoordsResult> {
  "use cache";
  cacheLife("landing");
  cacheTag("geo-from-coords", `geo-from-coords:${request.latitude},${request.longitude}`);

  return fetchGeoFromCoords(baseUrl, request);
}
