import { otpErrorResponse, type StartOtpResponse, startOtp } from "@features/otp/bff";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface StartOtpEnvelope {
  data: StartOtpResponse;
}

/**
 * POST /api/v1/auth/otp/start — start the OTP flow (EMAIL | SMS).
 * The use case owns error handling and logging; this handler shapes the
 * envelope. Response carries no meta.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);

  const result = await startOtp(body);
  if (!result.success) {
    return otpErrorResponse(result.error);
  }

  return NextResponse.json<StartOtpEnvelope>({
    data: result.data,
  });
}
