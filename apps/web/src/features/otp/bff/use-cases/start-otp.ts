import "server-only";

import { createLogger } from "@shared/lib/logger";
import type { StartOtpResponse } from "../contracts/start-otp.schema";
import { mapCaughtToOtpError, type OtpError } from "../errors/otp.errors";
import type { BffResult } from "../lib/bff-result";
import { mockStartOtp } from "../services/start-otp-mock";

// Inline for now; extract to a shared auth logger later.
const authLogger = createLogger("auth");

export type StartOtpResult = BffResult<StartOtpResponse, OtpError>;

// TODO: log the upstream traceId once the real upstream is wired.
function successResponse(data: StartOtpResponse): StartOtpResult {
  authLogger.info("otp start succeeded", { channel: data.channel });
  return { success: true, data };
}

// Logs code/status only — no PII.
// TODO: log the upstream traceId once the real upstream is wired.
function failResponse(error: OtpError): StartOtpResult {
  authLogger.warn("otp start failed", {
    code: error.code,
    errorCode: error.errorCode,
    status: error.status,
  });
  return { success: false, error };
}

// Mock-only for now; the mock throws upstream-shaped errors so mapping matches
// production. Never throws.
// TODO: wire the real visitors upstream (BED passwordless/start).
export async function startOtp(request: unknown): Promise<StartOtpResult> {
  try {
    const data = await mockStartOtp(request);
    return successResponse(data);
  } catch (error) {
    return failResponse(mapCaughtToOtpError(error));
  }
}
