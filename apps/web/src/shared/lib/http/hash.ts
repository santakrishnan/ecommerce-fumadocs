/**
 * Compute the lowercase-hex SHA-256 digest of a UTF-8 string.
 *
 * One-way hash via Web Crypto (`crypto.subtle.digest`) — available in Node,
 * edge, and browser runtimes, so it is safe to import from any server module.
 * Use it to derive a stable, opaque token from an identifier (e.g. a device
 * fingerprint id) before sending it to an upstream service.
 *
 * Note: SHA-256 is not encryption and cannot be reversed. The digest is
 * deterministic, so it remains a linkable pseudonym for anyone who already
 * holds the raw input — add an HMAC pepper if you need to defeat correlation.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
