import { clientEnv } from "@config/client-env";
import * as jose from "jose";

export const ENCRYPTED_HEADER = "X-Encrypted";

/**
 * Resolve an encryption key from environment.
 *
 * Checks `ENCRYPTION_KEY` (server) then `NEXT_PUBLIC_ENCRYPTION_KEY` (client).
 * The key must be Base64url-encoded AES-256 (32 raw bytes).
 *
 * Returns `null` when no key is configured — callers should treat this as
 * "encryption not available" rather than throw.
 */
export function resolveEncryptionKey(): Uint8Array | null {
  // Reads process.env directly — see ADR-0011 §7 (Documented exceptions).
  const raw = process.env.ENCRYPTION_KEY ?? clientEnv.NEXT_PUBLIC_ENCRYPTION_KEY ?? null;
  if (!raw) {
    return null;
  }
  try {
    return jose.base64url.decode(raw);
  } catch {
    return null;
  }
}

/**
 * Encrypt a JSON-serialisable payload into a compact JWE string.
 *
 * Algorithm: A256KW (AES-256 Key Wrap) + A256GCM (AES-256-GCM content encryption).
 */
export async function encryptPayload(payload: unknown, key: Uint8Array): Promise<string> {
  // Copy into a fresh Uint8Array so it's an instance of *this* realm's
  // Uint8Array — jose's webapi build does a strict `instanceof` check and
  // some environments (jsdom, edge runtimes) expose a different realm than
  // `TextEncoder.encode()`.
  const plaintext = new Uint8Array(new TextEncoder().encode(JSON.stringify(payload)));
  return await new jose.CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "A256KW", enc: "A256GCM" })
    .encrypt(new Uint8Array(key));
}

/**
 * Decrypt a compact JWE string and return the parsed JSON payload.
 */
export async function decryptPayload<T = unknown>(jwe: string, key: Uint8Array): Promise<T> {
  const { plaintext } = await jose.compactDecrypt(jwe, key);
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
