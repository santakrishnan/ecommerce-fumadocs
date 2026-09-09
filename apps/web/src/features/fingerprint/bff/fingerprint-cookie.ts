import "server-only";

import { decodeCookieValue, encodeCookieValue } from "@shared/lib/http/sealed-cookie";

/**
 * Encode the verified `visitorId` for the httpOnly cookie.
 *
 * No encryption required: the cookie is `httpOnly` and only ever set/read
 * server-side, so it's never exposed to client JS. Base64url keeps the value
 * opaque and delimiter-safe.
 */
export function encodeVisitorId(visitorId: string): string {
  return encodeCookieValue(visitorId);
}

/** Reverse of {@link encodeVisitorId}. Returns `null` on a malformed value. */
export function decodeVisitorId(token: string): string | null {
  return decodeCookieValue(token);
}
