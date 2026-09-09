import "server-only";

import {
  getVehicleDetail as getVehicleDetailCanonical,
  transformVdpToWelcomeBackShape,
} from "@features/vehicle-detail/bff";
import type { DealerDeal } from "../../data/schemas/dealer-deal";
import { dealerDealSchema } from "../../data/schemas/dealer-deal";
import { mapToDealerDeal } from "../mappers/map-to-dealer-deal";
import { getVehicleDeal } from "../services/get-vehicle-deal";

export type GetDealerDealResult =
  | { success: true; data: DealerDeal }
  | { success: false; error: { code: string; message: string } };

/**
 * Use case: fetch and assemble a DealerDeal for the given VIN.
 *
 * Orchestrates vehicle detail (from canonical VDP use-case) + loan origination
 * services, maps the upstream responses into the DealerDeal UI contract, and validates
 * the assembled shape before returning.
 *
 * Delegates vehicle detail lookup to the canonical Vehicle Detail BFF use-case (ADR-9),
 * then adapts the response to the Landing/Welcome Back shape expected by this use-case.
 */
export async function getDealerDeal(vin: string): Promise<GetDealerDealResult> {
  const [vehicleDetailResult, dealResult] = await Promise.all([
    getVehicleDetailCanonical({
      vin,
      visitorId: null,
      forceMock: true,
      // traceId intentionally omitted — the canonical use-case generates it
      // internally after its first await, satisfying Next.js 16 PPR constraints
      // (crypto.randomUUID() must not be called synchronously during prerender).
    }),
    getVehicleDeal(vin),
  ]);

  if (!vehicleDetailResult.success) {
    return {
      success: false,
      error: {
        code: vehicleDetailResult.error.code,
        message: vehicleDetailResult.error.message,
      },
    };
  }

  if ("error" in dealResult) {
    return { success: false, error: dealResult.error };
  }

  // Adapt canonical VDP response to Landing shape
  const adaptedVehicle = transformVdpToWelcomeBackShape(vehicleDetailResult.data);

  // Check if adaptation resulted in error
  if ("error" in adaptedVehicle) {
    return {
      success: false,
      error: adaptedVehicle.error as { code: string; message: string },
    };
  }

  const mapped = mapToDealerDeal(adaptedVehicle, dealResult);
  const validated = dealerDealSchema.safeParse(mapped);

  if (!validated.success) {
    console.error("[getDealerDeal] Assembled deal failed validation", validated.error.issues);
    return {
      success: false,
      error: {
        code: "DEALER_DEAL_VALIDATION_FAILED",
        message: "Assembled dealer deal did not match contract.",
      },
    };
  }

  return { success: true, data: validated.data };
}
