import { NextResponse } from "next/server";
import type { OtpError, OtpErrorCode } from "./otp.errors";

export interface OtpErrorBody {
  error: {
    code: OtpErrorCode;
  };
}

// Serialize an OtpError to a NextResponse with the code only; the upstream
// `errorCode` and any message are withheld from the client.
export function otpErrorResponse(error: OtpError): NextResponse<OtpErrorBody> {
  return NextResponse.json<OtpErrorBody>(
    {
      error: { code: error.code },
    },
    { status: error.status }
  );
}
