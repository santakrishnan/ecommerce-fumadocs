import { type FingerprintSessionResponse, readFingerprintSession } from "@features/fingerprint/bff";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/fingerprint/session
 *
 * Returns the server-authoritative fingerprint session (derived from httpOnly
 * cookies) so the client can decide cold vs warm and hydrate its context
 * without ever reading a cookie in the browser.
 */
export async function GET(): Promise<NextResponse<FingerprintSessionResponse>> {
  const session = await readFingerprintSession();
  return NextResponse.json<FingerprintSessionResponse>(session);
}
