/**
 * Sealed Cookie Utilities
 *
 * Universal (Node + browser) Base64url codec for opaque cookie values, and
 * a helper to build a hardened cookie configuration. Avoids Node's `Buffer`
 * so the module is safe to import from anywhere in the bundle.
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const TRAILING_EQUALS = /=+$/;
const PLUS_GLOBAL = /\+/g;
const SLASH_GLOBAL = /\//g;
const DASH_GLOBAL = /-/g;
const UNDERSCORE_GLOBAL = /_/g;

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    // Safe: byte values are 0–255 → valid char codes.
    binary += String.fromCharCode(bytes[i] as number);
  }
  // btoa exists in browsers and Node 16+.
  const base64 = btoa(binary);
  return base64.replace(TRAILING_EQUALS, "").replace(PLUS_GLOBAL, "-").replace(SLASH_GLOBAL, "_");
}

function base64urlToBytes(token: string): Uint8Array {
  const padding = token.length % 4 === 0 ? 0 : 4 - (token.length % 4);
  const base64 =
    token.replace(DASH_GLOBAL, "+").replace(UNDERSCORE_GLOBAL, "/") + "=".repeat(padding);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a string to Base64url for opaque, transport-safe cookie storage.
 */
export function encodeCookieValue(value: string): string {
  return bytesToBase64url(textEncoder.encode(value));
}

/**
 * Decode a Base64url cookie value.
 * Returns `null` if decoding fails or the value is empty.
 */
export function decodeCookieValue(token: string): string | null {
  if (!token) {
    return null;
  }
  try {
    const decoded = textDecoder.decode(base64urlToBytes(token));
    return decoded || null;
  } catch {
    return null;
  }
}

export interface CookieConfig {
  httpOnly: boolean;
  /** Browser-enforced TTL in seconds. */
  maxAge: number;
  /** Final cookie name (includes `__Host-` prefix in production). */
  name: string;
  path: string;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
}

/**
 * Build a hardened cookie configuration.
 *
 * In production the `__Host-` prefix is applied, which enforces `Secure=true`,
 * `Path=/`, and no `Domain` (prevents subdomain leaks).
 */
export function buildCookieConfig(
  baseName: string,
  ttl: number,
  options?: { httpOnly?: boolean; sameSite?: "lax" | "strict" | "none" }
): CookieConfig {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: options?.httpOnly ?? true,
    maxAge: ttl,
    name: isProduction ? `__Host-${baseName}` : baseName,
    path: "/",
    sameSite: options?.sameSite ?? "lax",
    secure: isProduction,
  };
}
