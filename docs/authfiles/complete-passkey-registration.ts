import "server-only";

import { env } from "@config/env";
import { AuthTier } from "@features/auth/constants";
import { ServerHttpError } from "@shared/lib/http";
import { HTTP_STATUS_NOT_IMPLEMENTED } from "@shared/lib/http/status-codes";
import { createLogger } from "@shared/lib/logger";
import type { Result } from "@ucmp/shared/types";
import type { AuthProfile } from "../contracts/auth-profile";
import type { PasskeyRegisterRequest } from "../contracts/passkey-verify.schema";
import { PasskeyErrorCode, type PasskeyErrorPayload } from "../errors/passkey.errors";
import { createPasskeyError } from "../errors/passkey.server.errors";
import type { PasskeyRequestContext } from "../lib/passkey-request";
import { buildAuthProfile } from "../services/build-auth-profile";
import { mockVerifyRegistration } from "../services/passkey-verify-mock";
import { requireRegistrationSession, upstreamErrorCode } from "./passkey-registration-guard";

const passkeyLogger = createLogger("auth");

export type CompletePasskeyResult = Result<AuthProfile, PasskeyErrorPayload>;

// Logs code + trace id only — never the attestation, authSession or session id.
function fail(code: PasskeyErrorCode, traceId: string): CompletePasskeyResult {
  const error = createPasskeyError(code);
  passkeyLogger.warn("passkey completion rejected", {
    code: error.code,
    status: error.status,
    traceId,
  });
  return { success: false, error };
}

/**
 * Complete passkey registration (step 2): verify the attestation and record the
 * credential. The route has already validated the `register` body.
 * Guards: T1+ session → 401; challenge/attestation → 400 VERIFICATION_FAILED;
 * credential already registered → 409 ALREADY_REGISTERED.
 * Returns the auth profile, still at T1 (registration doesn't raise the tier).
 */
export async function completePasskeyRegistration(
  request: PasskeyRegisterRequest,
  ctx: PasskeyRequestContext
): Promise<CompletePasskeyResult> {
  const sessionId = await requireRegistrationSession();
  if (!sessionId) {
    return fail(PasskeyErrorCode.UNAUTHORIZED, ctx.traceId);
  }

  try {
    return await completeRegistration(request, sessionId, ctx);
  } catch (error) {
    const code = upstreamErrorCode(error);
    if (code === PasskeyErrorCode.SERVER_ERROR) {
      passkeyLogger.error("passkey completion failed", {
        message: error instanceof Error ? error.message : "unknown",
        traceId: ctx.traceId,
      });
    }
    return fail(code, ctx.traceId);
  }
}

function completeRegistration(
  request: PasskeyRegisterRequest,
  sessionId: string,
  ctx: PasskeyRequestContext
): Promise<CompletePasskeyResult> {
  if (env.USE_AUTH_MOCKS === "true") {
    return mockComplete(request, sessionId, ctx);
  }
  return completeUpstream(ctx);
}

async function mockComplete(
  request: PasskeyRegisterRequest,
  sessionId: string,
  ctx: PasskeyRequestContext
): Promise<CompletePasskeyResult> {
  const result = await mockVerifyRegistration({
    authSession: request.authSession,
    sessionId,
    response: request.response,
    deviceLabel: request.deviceName,
    userAgent: ctx.userAgent,
  });
  // Bad/used/expired challenge or attestation → restart from options.
  if (!result.verified) {
    return fail(
      result.alreadyRegistered
        ? PasskeyErrorCode.ALREADY_REGISTERED
        : PasskeyErrorCode.VERIFICATION_FAILED,
      ctx.traceId
    );
  }

  // Registration records a credential but does not authenticate with it, so the
  // tier stays T1; the capability surfaces as `hasPasskey`. The profile reflects
  // the just-verified passkey.
  const data = buildAuthProfile([result.passkey], AuthTier.T1);
  passkeyLogger.info("passkey registration completed", {
    action: request.action,
    traceId: ctx.traceId,
  });
  return { success: true, data };
}

// VPS `PUT /auth/passkey {action:"register"}` integration point; throws 501 until
// wired. Use the shared BED client and forward the request context:
//   createBedClient(service, { forwardedHeaders: ctx.forwardedHeaders })
//     .put(path, request, { headers: { "X-Trace-Id": ctx.traceId } })
function completeUpstream(_ctx: PasskeyRequestContext): Promise<never> {
  throw new ServerHttpError(
    "PUT /auth/passkey (register) upstream is not yet implemented",
    HTTP_STATUS_NOT_IMPLEMENTED,
    "HTTP_501",
    "EDI",
    { status: HTTP_STATUS_NOT_IMPLEMENTED }
  );
}
