"use server";

import { randomUUID } from "node:crypto";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import type { PatchOriginationResponse } from "../bff/contracts/patch-origination-response.schema";
import { tradeInRequestSchema } from "../bff/contracts/trade-in-request.schema";
import type { OriginationError } from "../bff/errors/origination.errors";
import { patchOrigination } from "../bff/use-cases/patch-origination";

export type SubmitTradeInResult =
  | { success: true; data: PatchOriginationResponse }
  | {
      success: false;
      error: OriginationError | { code: "VALIDATION_FAILED"; message: string; status: 400 };
    };

export async function submitTradeInAction(
  originationId: string,
  rawInput: unknown
): Promise<SubmitTradeInResult> {
  const parsed = tradeInRequestSchema.safeParse(rawInput);
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

  return patchOrigination(
    { originationId, step: "trade-in", status: "completed" },
    traceId,
    identity
  );
}
