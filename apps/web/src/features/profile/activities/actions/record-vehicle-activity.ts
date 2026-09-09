"use server";

import { anonymousVehicleActivitySchema } from "../bff/contracts/vehicle-activity-input.schema";
import { appendActivityDebugEntry } from "../bff/lib/activity-debug-store";
import { recordVehicleActivity } from "../bff/use-cases/record-vehicle-activity";

export type { AnonymousVehicleActivityInput as AnonymousActivityEvent } from "../bff/contracts/vehicle-activity-input.schema";

/**
 * Server Action: record a single vehicle activity event.
 *
 * Validates the payload against a Zod discriminated union that checks each
 * vehicle variant's required fields (vin, title, source where required) before
 * the use-case runs. Invalid or non-vehicle payloads resolve silently — no
 * throw — preserving the fire-and-forget contract.
 *
 * Identity is read server-side in the use-case; no visitor data is expected
 * from the caller.
 *
 * In development, Zod validation failures are written to the debug ring buffer
 * under a sentinel key so they surface in the /visitor/debug Activity Log even
 * before identity resolves — helping diagnose payload contract issues.
 */
export async function recordVehicleActivityAction(event: unknown): Promise<void> {
  const parsed = anonymousVehicleActivitySchema.safeParse(event);
  if (!parsed.success) {
    if (process.env.NODE_ENV === "development") {
      const type =
        typeof event === "object" && event !== null && "type" in event
          ? String((event as { type: unknown }).type)
          : "unknown";
      const reason = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      appendActivityDebugEntry("__dev__", {
        type,
        status: "error",
        reason: `validation failed: ${reason}`,
      });
    }
    return;
  }
  await recordVehicleActivity(parsed.data);
}
