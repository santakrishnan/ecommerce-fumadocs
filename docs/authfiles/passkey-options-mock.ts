import "server-only";

import { clientEnv } from "@config/client-env";
import { readStoredPasskeys } from "@features/auth/actions/passkey-store";
import type {
  AuthenticatorSelectionCriteria,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { PasskeyOptionsResponse } from "../contracts/passkey-options.schema";
import { getMockShopperHandle } from "./mock-shopper";
import { CHALLENGE_TTL_MS, listCredentials, putPasskeyChallenge } from "./passkey-challenge-store";

// Mock issuer (ceremony step 1): mint options + authSession, store the challenge. MOCKS ONLY.

// WebAuthn ceremony policy. `getRpId`/`getAllowedOrigins` are shared with the
// verifier so issue and verify can't drift.
const RP_NAME = "UCMP";
const CEREMONY_TIMEOUT_MS = 60_000;

// Discoverable (resident) credential + user verification required.
const AUTHENTICATOR_SELECTION: AuthenticatorSelectionCriteria = {
  residentKey: "required",
  requireResidentKey: false,
  userVerification: "required",
};

/** RP ID = registrable domain of the site URL; dev → localhost. */
export function getRpId(): string {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      return new URL(siteUrl).hostname;
    } catch {
      // fall through to the dev default
    }
  }
  return "localhost";
}

/** Origins a registration response may have come from (checked at verify time). */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>(["http://localhost:3000", "https://localhost:3000"]);
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin);
    } catch {
      // ignore a malformed site URL — the dev defaults still apply
    }
  }
  return [...origins];
}

/** A passkey the shopper already has, so the authenticator won't create a duplicate. */
interface ExistingCredential {
  id: string;
  transports?: AuthenticatorTransportFuture[];
}

export interface IssueRegistrationOptionsInput {
  /** The visitor session the options are bound to (opaque session id). */
  sessionId: string;
  /** Shopper-facing label for the credential (display only, never a secret). */
  shopperLabel?: string;
}

/**
 * The shopper's known passkeys, without duplicates: the ones this mock stored,
 * plus the `ucmp-passkeys` cookie the current UI writes directly.
 */
async function excludedCredentials(userHandle: string): Promise<ExistingCredential[]> {
  const stored = (await listCredentials(userHandle)).map(({ credentialId, transports }) => ({
    id: credentialId,
    transports,
  }));
  const fromCookie = (await readStoredPasskeys()).map(({ id, transports }) => ({ id, transports }));
  const byId = new Map([...fromCookie, ...stored].map((credential) => [credential.id, credential]));
  return [...byId.values()];
}

export async function mockIssueRegistrationOptions(
  input: IssueRegistrationOptionsInput
): Promise<PasskeyOptionsResponse> {
  const { userHandle, userId, userName, userDisplayName } = getMockShopperHandle(
    input.shopperLabel
  );

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userName,
    userDisplayName,
    // Stable per-shopper handle so re-registration keeps one user identity.
    userID: userId,
    timeout: CEREMONY_TIMEOUT_MS,
    // No attestation statement — we only need the public key.
    attestationType: "none",
    authenticatorSelection: AUTHENTICATOR_SELECTION,
    // An authenticator that already holds one of these refuses to register again.
    excludeCredentials: await excludedCredentials(userHandle),
  });

  const authSession = crypto.randomUUID();

  await putPasskeyChallenge(authSession, {
    ceremony: "register",
    challenge: options.challenge,
    sessionId: input.sessionId,
    userHandle,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });

  return { options, authSession };
}
