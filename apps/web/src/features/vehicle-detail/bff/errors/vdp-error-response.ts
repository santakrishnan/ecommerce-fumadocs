import { NextResponse } from "next/server";
import type { VdpError, VdpErrorCode } from "./vdp.errors";

export interface VdpErrorBody {
  error: { code: VdpErrorCode; message: string };
  meta: { traceId: string; timestamp: number };
}

export function vdpErrorResponse(error: VdpError, traceId: string): NextResponse<VdpErrorBody> {
  return NextResponse.json<VdpErrorBody>(
    {
      error: { code: error.code, message: error.message },
      meta: { traceId, timestamp: Date.now() },
    },
    { status: error.status }
  );
}
