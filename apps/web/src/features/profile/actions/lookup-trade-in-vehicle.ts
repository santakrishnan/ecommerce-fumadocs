"use server";

import { z } from "zod";
import {
  type LookupTradeInVehicleResult,
  lookupTradeInVehicle,
} from "../bff/use-cases/lookup-trade-in-vehicle";

const lookupTradeInVehicleSchema = z.object({
  plate: z.string().trim().min(1, "License plate or VIN is required"),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "A valid 2-letter US state code is required"),
});

/**
 * Server Action: validate inputs and look up a vehicle's estimated trade-in value.
 *
 * Validates with Zod:
 * - plate is non-empty
 * - state is a valid 2-letter US state code
 */
export async function lookupTradeInVehicleAction(
  plate: string,
  state: string
): Promise<LookupTradeInVehicleResult> {
  const parsed = lookupTradeInVehicleSchema.safeParse({ plate, state });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      success: false,
      error: {
        code: "PROFILE_VALIDATION_FAILED",
        message: firstError?.message ?? "Invalid input",
        status: 400,
      },
    };
  }

  return lookupTradeInVehicle(parsed.data.plate, parsed.data.state);
}
