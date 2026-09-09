"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import { phoneVerificationRequestSchema } from "../bff/contracts/phone-verification-request.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitPhoneVerificationResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitPhoneVerificationAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitPhoneVerificationResult> {
  const parsed = phoneVerificationRequestSchema.safeParse(rawInput);
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

  // The shared PATCH records only the step transition. A dedicated phone
  // endpoint will consume parsed.data.phone when the BED OpenAPI spec lands.
  return patchOrigination(
    { originationId, step: "phone-verification", status: "completed" },
    traceId,
    identity
  );
}
