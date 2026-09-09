import "server-only";

import { env } from "@config/env";
import { FORCE_SOLD_VINS } from "@features/vehicle-detail/__fixtures__/vdp-demo-registry";
import type { VdpApiResponse } from "@features/vehicle-detail/bff";
import { getVehicleDetail } from "@features/vehicle-detail/bff";
import { cookies } from "next/headers";
import { VDP_COOKIE_SOLD } from "../flags/vdp-flags.constants";

export type VehicleStatus = "available" | "sold" | "not-found";

interface StatusResult {
  vdpData?: VdpApiResponse;
  vehicleStatus: VehicleStatus;
}

/**
 * Attempt a BFF lookup for the given VIN.
 * Returns `null` when the BFF is unavailable or not configured.
 */
async function fetchFromBff(vin: string, forceSold: boolean): Promise<StatusResult | null> {
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();
  const useMocks = env.USE_VDP_MOCKS === "true";

  if (!(upstreamUrl || useMocks)) {
    return null;
  }

  try {
    const result = await getVehicleDetail({
      vin: vin.toUpperCase(),
      visitorId: null,
      traceId: crypto.randomUUID(),
    });

    if (!result.success) {
      if (result.error.code === "VDP_NOT_FOUND") {
        return { vehicleStatus: "not-found" };
      }
      return { vehicleStatus: forceSold ? "sold" : "available" };
    }

    const vehicle = result.data.data.vehicle;
    if (!vehicle) {
      return { vehicleStatus: "not-found" };
    }

    if (forceSold) {
      return {
        vehicleStatus: "sold",
        vdpData: result.data,
      };
    }

    const status = vehicle.status.vehicleStatus.toLowerCase();
    const isSold = status === "sold" || FORCE_SOLD_VINS.has(vin.toUpperCase());
    return {
      vehicleStatus: isSold ? "sold" : "available",
      vdpData: result.data,
    };
  } catch {
    return null;
  }
}

/**
 * Determines vehicle availability status for a given VIN.
 *
 * Priority order:
 * 1. Cookie override (VDP_COOKIE_SOLD) — highest priority, no restart needed
 * 2. BFF use-case (API_UPSTREAM_URL or USE_VDP_MOCKS)
 * 3. Environment variable (FORCE_VDP_SOLD)
 * 4. Default: "available"
 *
 * Also returns VDP data (when available) to avoid duplicate BFF calls in the
 * page layer. Dealer insight identifiers (dealerCode, traceId) are derived from
 * vdpData by downstream consumers.
 */
export async function getVehicleStatus(vin: string): Promise<StatusResult> {
  // 1. Cookie override takes priority — allows toggling via dev-flags UI
  const cookieStore = await cookies();
  const soldCookie = cookieStore.get(VDP_COOKIE_SOLD)?.value;
  const forceSoldViaCookie = soldCookie === "true";

  // 2. BFF lookup via getVehicleDetail
  const bffResult = await fetchFromBff(vin, forceSoldViaCookie);
  if (bffResult) {
    return bffResult;
  }

  // If cookie override is active but no BFF is configured, return sold without data.
  if (forceSoldViaCookie) {
    return { vehicleStatus: "sold" };
  }

  // 3. Fallback: use env var to toggle sold state for development/testing
  if (env.FORCE_VDP_SOLD === "true") {
    return { vehicleStatus: "sold" };
  }

  // 4. Default
  return { vehicleStatus: "available" };
}
