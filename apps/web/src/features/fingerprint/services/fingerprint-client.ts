import type { EnrichResponse, FingerprintSessionResponse } from "../bff/contracts/enrich.schema";
import { FINGERPRINT_ENRICH_URL, FINGERPRINT_SESSION_URL } from "../constants";

/**
 * Client-side calls to the fingerprint BFF endpoints.
 *
 * The server reads/writes the httpOnly cookies; the client only ever exchanges
 * JSON with these two endpoints and never touches a cookie.
 */

/**
 * GET the server-authoritative fingerprint session (verified id + geo, derived
 * from the httpOnly cookies). Drives the cold-vs-warm decision.
 */
export async function fetchFingerprintSession(): Promise<FingerprintSessionResponse> {
  const res = await fetch(FINGERPRINT_SESSION_URL, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Fingerprint session failed: ${res.status}`);
  }
  return res.json();
}

/**
 * POST a fresh `requestId` to the geo-enrichment endpoint. Called once on a cold
 * fingerprint; the server verifies identity via `getEvent`, sets the httpOnly
 * cookies, and returns `{ visitorId, zip, coordinates }`.
 */
export async function enrichFingerprintClient(requestId: string): Promise<EnrichResponse> {
  const res = await fetch(FINGERPRINT_ENRICH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (!res.ok) {
    throw new Error(`Fingerprint enrich failed: ${res.status}`);
  }
  return res.json();
}
