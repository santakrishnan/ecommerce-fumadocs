import { NextResponse } from "next/server";
import type { OriginationError, OriginationErrorCode } from "./origination.errors";

export interface OriginationErrorBody {
  error: { code: OriginationErrorCode; message: string };
  meta: { traceId: string; timestamp: number };
}

/**
 * Serialize an `OriginationError` into a typed `NextResponse` for route
 * handlers and Server Actions. Mirrors the search domain's error envelope
 * (`{ error, meta }`) so the whole BFF surface stays consistent.
 */
export function originationErrorResponse(
  error: OriginationError,
  traceId: string
): NextResponse<OriginationErrorBody> {
  return NextResponse.json<OriginationErrorBody>(
    {
      error: { code: error.code, message: error.message },
      meta: { traceId, timestamp: Date.now() },
    },
    { status: error.status }
  );
}
