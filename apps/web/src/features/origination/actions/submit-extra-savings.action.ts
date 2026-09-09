"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { extraSavingsRequestSchema } from "../bff/contracts/extra-savings-request.schema";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitExtraSavingsResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitExtraSavingsAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitExtraSavingsResult> {
  const parsed = extraSavingsRequestSchema.safeParse(rawInput);
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

  // TODO (PEDX01-3283): call the dedicated extra-savings endpoint with the
  // selection map (parsed.data.military / parsed.data.graduate) once the BED
  // OpenAPI spec lands. The shared PATCH carries no step payload by design —
  // see bff/contracts/patch-origination-request.schema.ts.
  return patchOrigination(
    { originationId, step: "extra-savings", status: "completed" },
    traceId,
    identity
  );
}
