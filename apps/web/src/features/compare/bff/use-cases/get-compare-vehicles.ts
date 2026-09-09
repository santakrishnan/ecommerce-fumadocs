import "server-only";

import { resolveBedService } from "@config/bed-services";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { CompareVehicle } from "../../types";
import {
  type CompareError,
  createCompareError,
  mapCaughtToCompareError,
} from "../errors/compare.errors";
import { mockFetchCompareVehicles } from "../services/compare-vehicles-mock";
import { fetchCompareVehicles } from "../services/compare-vehicles-upstream";

type GetCompareVehiclesResult =
  | { success: true; data: CompareVehicle[] }
  | { success: false; error: CompareError };

async function getCompareVehicles(vins: string[]): Promise<GetCompareVehiclesResult> {
  if (vins.length === 0) {
    return { success: true, data: [] };
  }

  if (process.env.USE_COMPARE_MOCKS === "true") {
    const data = await mockFetchCompareVehicles(vins);
    return { success: true, data };
  }

  const service = resolveBedService("vehicle-detail");
  if (!service) {
    return {
      success: false,
      error: createCompareError(
        "UpstreamUnavailable",
        "Vehicle service is not configured (API_UPSTREAM_URL + VDP_API_KEY)",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  try {
    const data = await fetchCompareVehicles(service, vins);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: mapCaughtToCompareError(error) };
  }
}

export { type GetCompareVehiclesResult, getCompareVehicles };
