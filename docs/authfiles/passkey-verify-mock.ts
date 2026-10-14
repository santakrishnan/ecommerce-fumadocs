import "server-only";

import { readStoredPasskeys } from "@features/auth/actions/passkey-store";
import type { AuthPasskey } from "@features/profile/bff";
import { passkeyLabelFromUserAgent } from "@features/profile/bff/services/passkey-label";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import {
  consumePasskeyChallenge,
  listCredentials,
  saveCredential,
} from "./passkey-challenge-store";
import { getAllowedOrigins, getRpId } from "./passkey-options-mock";

// Mock verifier (ceremony step 2), standing in for EDI: redeem the challenge,
// verify the attestation, reject duplicates, and keep the public key in the
// passkey store (`PASSKEY_STORE`). MOCKS ONLY — EDI does all of this in production.

export interface VerifyRegistrationInput {
  /** The one-time handle from the options step. */
  authSession: string;
  deviceLabel?: string;
  response: RegistrationResponseJSON;
  /** The visitor session the challenge must belong to. */
  sessionId: string;
  /** Fallback label source when the client sends no `deviceName`. */
  userAgent: string | null;
}

export type VerifyRegistrationResult =
  | { verified: true; passkey: AuthPasskey }
  | { verified: false; alreadyRegistered?: boolean };

/**
 * Redeem the challenge and verify the attestation; on success persist the
 * credential's public key and return a display entry for the new passkey.
 * A missing, expired or other session's challenge is `verified: false`.
 */
export async function mockVerifyRegistration(
  input: VerifyRegistrationInput
): Promise<VerifyRegistrationResult> {
  const { authSession, sessionId, response, deviceLabel, userAgent } = input;

  // Single use, owner checked first (see passkey-challenge-store).
  const record = await consumePasskeyChallenge({ authSession, sessionId });
  if (!record) {
    return { verified: false };
  }

  // SimpleWebAuthn throws (rather than returning `verified: false`) when the
  // attestation is malformed or the challenge/origin/RP ID don't match. Those
  // are client-side verification failures, not server faults, so swallow the
  // throw and report `verified: false`.
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: record.challenge,
      expectedOrigin: getAllowedOrigins(),
      expectedRPID: getRpId(),
      requireUserVerification: true,
    });
  } catch {
    return { verified: false };
  }

  if (!(verification.verified && verification.registrationInfo)) {
    return { verified: false };
  }

  const { credential } = verification.registrationInfo;
  // Known passkeys: the ones this mock stored, plus the `ucmp-passkeys` cookie
  // the current UI writes directly.
  const knownIds = new Set([
    ...(await listCredentials(record.userHandle)).map(({ credentialId }) => credentialId),
    ...(await readStoredPasskeys()).map(({ id }) => id),
  ]);
  if (knownIds.has(credential.id)) {
    return { verified: false, alreadyRegistered: true };
  }

  const label = deviceLabel ?? passkeyLabelFromUserAgent(userAgent) ?? "This device";
  const createdAt = new Date().toISOString();
  await saveCredential({
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? response.response.transports ?? [],
    userHandle: record.userHandle,
    label,
    createdAt,
  });

  return {
    verified: true,
    passkey: {
      id: crypto.randomUUID(),
      isThisDevice: true,
      deviceLabel: label,
      createdAt,
    },
  };
}
