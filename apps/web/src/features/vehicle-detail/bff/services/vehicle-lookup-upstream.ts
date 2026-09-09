import "server-only";

import type { ResolvedBedService } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import type { VehicleLookupResponse } from "@ucmp/sdk-search-api";
import type { VehicleDetailWithSoldAt } from "../contracts/vehicle-detail-with-sold-at";
import type { VehicleLookupResult } from "./vehicle-lookup-mock";

/**
 * Upstream vehicle lookup — calls `POST /vehicles` on the Vehicle Detail BED service.
 *
 * Uses `createBedClient` with the resolved "vehicle-detail" BED service so that
 * `VDP_API_KEY` is sent as `X-API-Key` and `BED_TENANT_ID` as `X-Tenant-Id`
 * on every request.
 *
 * Per the OpenAPI spec, `POST /vehicles` always returns 200 when the request
 * is valid. VINs not found in inventory are listed in `data.notFound[]` rather
 * than causing a 404 HTTP status.
 */
export async function fetchVehicleLookup(
  service: ResolvedBedService,
  vin: string,
  traceId: string,
  identity?: BedVisitorIdentity
): Promise<VehicleLookupResult> {
  const client = createBedClient(service, identity);

  const response = await client.post<VehicleLookupResponse>(
    "/vehicles",
    { vins: [vin] },
    { headers: { "X-Trace-Id": traceId } }
  );

  const vehicle = response.data.vehicles[0] as VehicleDetailWithSoldAt | undefined;

  if (!vehicle || response.data.notFound.includes(vin)) {
    return { success: false, notFound: true };
  }

  return { success: true, data: vehicle };
}
