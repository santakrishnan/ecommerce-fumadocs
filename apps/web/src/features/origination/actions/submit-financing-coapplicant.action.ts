"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { financingCoApplicantRequestSchema } from "../bff/contracts/financing-coapplicant-request.schema";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitFinancingCoApplicantResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitFinancingCoApplicantAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitFinancingCoApplicantResult> {
  const parsed = financingCoApplicantRequestSchema.safeParse(rawInput);
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

  // TODO (PEDX01-XXXX): call the dedicated financing co-applicant endpoint with
  // parsed.data.financingCoApplicant once the BED OpenAPI spec lands. The shared
  // PATCH carries no step payload by design — see
  // bff/contracts/patch-origination-request.schema.ts.
  return patchOrigination(
    { originationId, step: "own-or-coapplicant-financing", status: "completed" },
    traceId,
    identity
  );
}
