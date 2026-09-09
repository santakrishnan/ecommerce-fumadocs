"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import { purchaseMethodRequestSchema } from "../bff/contracts/purchase-method-request.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitPurchaseMethodResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitPurchaseMethodAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitPurchaseMethodResult> {
  const parsed = purchaseMethodRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message ?? "Invalid input",
        status: 400,
      },
    };
  }

  const identity = await readVisitorIdentity();
  const traceId = randomUUID();

  // TODO (PEDX01-XXXX): call the dedicated purchase-method endpoint with
  // parsed.data.purchaseMethod once the BED OpenAPI spec lands. The shared
  // PATCH carries no step payload by design — see
  // bff/contracts/patch-origination-request.schema.ts.
  return patchOrigination(
    { originationId, step: "purchase-method", status: "completed" },
    traceId,
    identity
  );
}
