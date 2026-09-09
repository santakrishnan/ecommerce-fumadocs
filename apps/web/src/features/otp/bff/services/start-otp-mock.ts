import "server-only";

import { ServerHttpError } from "@shared/lib/http/server-api";
import { HTTP_STATUS_BAD_REQUEST } from "@shared/lib/http/status-codes";
import { createLogger } from "@shared/lib/logger";
import { type StartOtpResponse, startOtpRequestSchema } from "../contracts/start-otp.schema";

const authLogger = createLogger("auth");

const MOCK_DELAY_MS = 50;
const OTP_CODE_LENGTH = 6;

// Random code, zero-padded so it's always exactly OTP_CODE_LENGTH digits.
// Logged so dev can enter it.
function generateMockOtpCode(): string {
  const max = 10 ** OTP_CODE_LENGTH;
  return String(Math.floor(Math.random() * max)).padStart(OTP_CODE_LENGTH, "0");
}

// Enforces the contract itself and throws the same 400 (EDI-TES-100) the real
// upstream would, so error mapping is identical.
export async function mockStartOtp(request: unknown): Promise<StartOtpResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const parsed = startOtpRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new ServerHttpError(
      "mock: invalid passwordless/start request",
      HTTP_STATUS_BAD_REQUEST,
      "HTTP_400",
      "EDI",
      { status: HTTP_STATUS_BAD_REQUEST, ediErrorCode: "EDI-TES-100" }
    );
  }

  // EDI and domain channel values coincide, so this flows through directly.
  const { channel, recipient } = parsed.data;

  // Dev-only: log the code (silent in prod) so a developer can enter it; the
  // code is never returned in the response.
  const code = generateMockOtpCode();
  authLogger.debug(`mock verification code for ${channel} ${recipient}: ${code}`);

  return {
    started: true,
    channel,
    recipient,
    message: "OTP sent.",
  };
}
