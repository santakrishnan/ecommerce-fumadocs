import {
  completePasskeyRegistration,
  completePasskeySignIn,
  createPasskeyError,
  PasskeyErrorCode,
  type PasskeyLoginRequest,
  type PasskeyRegisterRequest,
  passkeyDataResponse,
  passkeyErrorResponse,
  passkeyOptionsRequestSchema,
  passkeyVerifyRequestSchema,
  readJsonBody,
  startPasskeyRegistration,
  startPasskeySignIn,
  toPasskeyContext,
} from "@features/auth/passkey/bff";
import { getRequestTraceId } from "@shared/lib/http/request-trace";
import type { NextRequest } from "next/server";

// One endpoint, two ceremonies: the route validates the body once and dispatches
// on `action`; each use case owns its gate (registration needs T1, sign-in is
// open to T0), upstream call, errors and logging.
// Bodies must be `application/json` (CSRF guard); responses are `no-store`.

function invalidRequest() {
  return passkeyErrorResponse(createPasskeyError(PasskeyErrorCode.INVALID_REQUEST));
}

/**
 * POST /api/v1/auth/passkey — begin a ceremony.
 *   { action: "register-options" } → { data: { options, authSession }, meta }  (needs T1)
 *   { action: "login-options" }    → 501 until the sign-in slice
 */
export async function POST(request: NextRequest) {
  const traceId = await getRequestTraceId();
  const parsed = passkeyOptionsRequestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  const ctx = toPasskeyContext(request, traceId);
  const result =
    parsed.data.action === "register-options"
      ? await startPasskeyRegistration(ctx)
      : await startPasskeySignIn(ctx);
  if (!result.success) {
    return passkeyErrorResponse(result.error);
  }
  return passkeyDataResponse(result.data, traceId);
}

/**
 * PUT /api/v1/auth/passkey — complete a ceremony.
 *   { action: "register", authSession, response, deviceName? } → { data: AuthProfile, meta }
 *   { action: "login", authSession, response }                  → 501 until the sign-in slice
 */
export async function PUT(request: NextRequest) {
  const traceId = await getRequestTraceId();
  const parsed = passkeyVerifyRequestSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  const ctx = toPasskeyContext(request, traceId);
  // SimpleWebAuthn does the real structural check on `response`; the schema only caps it.
  const body = parsed.data;
  const result =
    body.action === "register"
      ? await completePasskeyRegistration(body as unknown as PasskeyRegisterRequest, ctx)
      : await completePasskeySignIn(body as unknown as PasskeyLoginRequest, ctx);
  if (!result.success) {
    return passkeyErrorResponse(result.error);
  }
  return passkeyDataResponse(result.data, traceId);
}
