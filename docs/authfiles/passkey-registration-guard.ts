import "server-only";

import { AuthTier } from "@features/auth/constants";
import { tierMeetsRequirement } from "@features/auth/lib/auth-utils";
import { getProfileTier } from "@features/profile/bff/use-cases/get-profile-tier";
import { readVisitorIdentity, ServerHttpError } from "@shared/lib/http";
import { HTTP_STATUS_NOT_IMPLEMENTED } from "@shared/lib/http/status-codes";
import { PasskeyErrorCode } from "../errors/passkey.errors";

// Shared by both registration steps so the gate and the error mapping can't drift.

/** Minimum tier allowed to enroll a passkey. */
export const REGISTER_REQUIRED_TIER = AuthTier.T1;

/**
 * The visitor session a registration is bound to, or `null` when the shopper
 * isn't signed in at T1+ (→ 401 UNAUTHORIZED).
 */
export async function requireRegistrationSession(): Promise<string | null> {
  if (!tierMeetsRequirement(await getProfileTier(), REGISTER_REQUIRED_TIER)) {
    return null;
  }
  const { sessionId } = await readVisitorIdentity();
  return sessionId || null;
}

/** An upstream failure as a domain code: 501 while VPS isn't wired, otherwise a server error. */
export function upstreamErrorCode(error: unknown): PasskeyErrorCode {
  return error instanceof ServerHttpError && error.status === HTTP_STATUS_NOT_IMPLEMENTED
    ? PasskeyErrorCode.NOT_IMPLEMENTED
    : PasskeyErrorCode.SERVER_ERROR;
}
