import "server-only";

import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { createPasskeyStore } from "./passkey-store";

// What the passkey mocks remember between the two ceremony steps: issued
// challenges and registered credentials (public keys). MOCKS ONLY — EDI holds
// both in production. Backend: `PASSKEY_STORE` (memory locally, encrypted cookie on Vercel).

// ─── Challenges ─────────────────────────────────────────────────────────────

/** How long a stored challenge stays valid before completion must restart. */
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** One issued, not-yet-completed registration, keyed by `authSession`. */
export interface PasskeyChallengeRecord {
  ceremony: "register";
  /** base64url challenge the authenticator must sign (as issued to the browser). */
  challenge: string;
  expiresAt: number;
  sessionId: string;
  userHandle: string;
}

/** Fields the completion step supplies to redeem a record. */
export interface PasskeyChallengeLookup {
  authSession: string;
  sessionId: string;
}

// A few in-flight ceremonies (e.g. two tabs); older ones are dropped.
const challenges = createPasskeyStore<PasskeyChallengeRecord>("challenge", {
  maxEntries: 3,
  ttlSeconds: CHALLENGE_TTL_MS / 1000,
});

export function putPasskeyChallenge(
  authSession: string,
  record: PasskeyChallengeRecord
): Promise<void> {
  return challenges.set(authSession, record);
}

/**
 * Spend a challenge once. Ownership is checked first, so another session
 * holding a leaked `authSession` can't burn it; once owned, the challenge is
 * consumed whether or not it has expired (single use).
 * Returns the record, or `undefined` on any miss/mismatch/expiry.
 */
export async function consumePasskeyChallenge(
  lookup: PasskeyChallengeLookup
): Promise<PasskeyChallengeRecord | undefined> {
  const record = await challenges.get(lookup.authSession);
  if (!record || record.sessionId !== lookup.sessionId) {
    return;
  }
  await challenges.delete(lookup.authSession);
  return record.expiresAt > Date.now() ? record : undefined;
}

// ─── Credentials (public keys) ──────────────────────────────────────────────

export interface StoredCredential {
  counter: number;
  createdAt: string;
  credentialId: string;
  /** Display label shown in the passkey list. */
  label: string;
  /** COSE public key, base64url. */
  publicKey: string;
  transports: AuthenticatorTransportFuture[];
  /** WebAuthn user handle (base64url) the credential was registered for. */
  userHandle: string;
}

// Keyed by credential id; one year, like the `ucmp-passkeys` cookie. Few per
// shopper so an encrypted cookie stays under the browser's size limit.
const credentials = createPasskeyStore<StoredCredential>("credentials", {
  maxEntries: 3,
  ttlSeconds: 60 * 60 * 24 * 365,
});

export function saveCredential(credential: StoredCredential): Promise<void> {
  return credentials.set(credential.credentialId, credential);
}

/** The shopper's registered credentials, oldest first. */
export async function listCredentials(userHandle: string): Promise<StoredCredential[]> {
  return (await credentials.values()).filter((credential) => credential.userHandle === userHandle);
}
