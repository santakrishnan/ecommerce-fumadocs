"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { incomeRequestSchema } from "../bff/contracts/income-request.schema";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitIncomeResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitIncomeAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitIncomeResult> {
  const parsed = incomeRequestSchema.safeParse(rawInput);
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

  // TODO (PEDX01-3347): pass parsed.data (annualGrossIncome + nonTaxableSources)
  // forward into the credit request (LFR-03) once that endpoint exists, rather
  // than persisting it here. The shared PATCH carries no step payload by
  // design — see bff/contracts/patch-origination-request.schema.ts. Raw income
  // is intentionally never logged — parsed.data must not be passed to any
  // logger.
  return patchOrigination(
    { originationId, step: "income", status: "completed" },
    traceId,
    identity
  );
}
