import "server-only";

import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { cacheLife, cacheTag } from "next/cache";
import type { FromZipRequest } from "../contracts/from-zip-request.schema";
import type { FromZipResponse } from "../contracts/from-zip-response.schema";
import {
  fromZipResponseSchema,
  fromZipUpstreamEnvelopeSchema,
} from "../contracts/from-zip-response.schema";
import { createGeoError, type GeoError, mapCaughtToGeoError } from "../errors/geo.errors";
import { mapFromZipUpstreamToResponse } from "../mappers/from-zip.mapper";
import { createGeoClient } from "./geo-client";

type FetchGeoFromZipResult =
  | { success: true; data: FromZipResponse }
  | { success: false; error: GeoError };

/**
 * Calls the external backend's /geo/v1/fromZip/{zip} endpoint and maps the response.
 * ZIP is a path parameter per the Arrow Geo API contract.
 */
async function fetchGeoFromZip(
  baseUrl: string,
  request: FromZipRequest
): Promise<FetchGeoFromZipResult> {
  const client = createGeoClient(baseUrl);

  try {
    const raw = await client.get(`/fromZip/${request.zip}`);

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
 * Cached wrapper around the upstream geo fromZip call.
 * Uses the "landing" cache profile (15 min stale, 15 min revalidate, 1 hr expire).
 *
 * Only non-secret primitives (`baseUrl`, `request.zip`) are passed in to keep
 * secrets (API key) out of cache key material. Auth headers are read from
 * `process.env` at request time inside `createGeoClient`.
 *
 * Tagged with `geo-from-zip` for on-demand revalidation via `/api/v1/revalidate`.
 */
export async function fetchGeoFromZipCached(
  baseUrl: string,
  request: FromZipRequest
): Promise<FetchGeoFromZipResult> {
  "use cache";
  cacheLife("landing");
  cacheTag("geo-from-zip", `geo-from-zip:${request.zip}`);

  return fetchGeoFromZip(baseUrl, request);
}
