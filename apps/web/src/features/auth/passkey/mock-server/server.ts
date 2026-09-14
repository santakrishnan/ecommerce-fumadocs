import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import type {
  AuthenticationResponseJSON,
  PasskeyCredentialSummary,
  PasskeyLoginResult,
  PasskeyRegisterInput,
  PasskeyRegisterResult,
} from "../contract";
import { type StoredCredential, store } from "./store";

/**
 * THROWAWAY mock relying party — CLEANUP REQUIRED when the upstream BED
 * passkey API is available:
 *   1. delete `src/features/auth/passkey/mock-server/`
 *   2. delete `src/app/api/auth/passkey/**` (the dev-only route files), or keep
 *      that path as a same-origin proxy to the BED so the cookie-bound
 *      challenge stays first-party
 *   3. remove `@simplewebauthn/server` from apps/web/package.json
 *   4. drop `getPasskeySession` / `resetPasskeyDemo` from `../client.ts` and the
 *      Reset link in `PasskeyPanel`
 * Only the storage is fake: verification (challenge, origin, RP ID, signature,
 * counter) is real, done with @simplewebauthn/server against `../contract.ts`.
 */

// ── Policy (banking-grade defaults) ─────────────────────────────────────────
/** Biometric or PIN required for both ceremonies. */
const USER_VERIFICATION = "required" as const;
/** Discoverable credentials: enables "Sign in with passkey" with no username. */
const RESIDENT_KEY = "required" as const;
const ATTESTATION = "none" as const;

const CHALLENGE_COOKIE = "passkey-demo-challenge";
const SESSION_COOKIE = "passkey-demo-session";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_S = 60 * 60 * 24;
const ZERO_AAGUID = "00000000-0000-0000-0000-000000000000";
const PORT_SUFFIX = /:\d+$/;

/** Library verification errors (malformed/forged responses) are client errors, not crashes. */
async function verified<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new MockRpError(`Verification failed: ${reason}`, 400);
  }
}

export class MockRpError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockRpError";
    this.status = status;
  }
}

// ── Relying party identity (derived from the request unless RP_* env is set) ─
export interface RelyingParty {
  id: string;
  name: string;
  origin: string;
}

export function relyingPartyFor(request: Request): RelyingParty {
  // Demo-only overrides (see README); the mock is never part of a product build.
  const envId = process.env.RP_ID;
  const envOrigin = process.env.RP_ORIGIN;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost";
  const hostname = host.replace(PORT_SUFFIX, "");
  const proto =
    request.headers.get("x-forwarded-proto") ?? (hostname === "localhost" ? "http" : "https");
  return {
    id: envId ?? hostname,
    origin: envOrigin ?? `${proto}://${host}`,
    name: process.env.RP_NAME ?? "UCMP passkey demo",
  };
}

// ── Challenges: in memory, keyed by an httpOnly cookie ──────────────────────
interface PendingChallenge {
  challenge: string;
  expiresAt: number;
  purpose: "register" | "login";
  userId?: string;
}

const challenges = new Map<string, PendingChallenge>();

async function issueChallenge(entry: Omit<PendingChallenge, "expiresAt">): Promise<void> {
  const key = randomUUID();
  challenges.set(key, { ...entry, expiresAt: Date.now() + CHALLENGE_TTL_MS });
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

async function consumeChallenge(purpose: PendingChallenge["purpose"]): Promise<PendingChallenge> {
  const jar = await cookies();
  const key = jar.get(CHALLENGE_COOKIE)?.value;
  const entry = key ? challenges.get(key) : undefined;
  if (key) {
    challenges.delete(key);
    jar.delete(CHALLENGE_COOKIE);
  }
  if (!entry || entry.purpose !== purpose) {
    throw new MockRpError("No pending challenge — start the flow again.", 400);
  }
  if (entry.expiresAt < Date.now()) {
    throw new MockRpError("Challenge expired — start the flow again.", 400);
  }
  return entry;
}

// ── Session (mock): a cookie holding the user id ─────────────────────────────
async function setSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function currentUser() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  return id ? (store.getUser(id) ?? null) : null;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(CHALLENGE_COOKIE);
}

function summarize(c: StoredCredential): PasskeyCredentialSummary {
  return {
    id: c.id,
    publicKey: c.publicKey,
    counter: c.counter,
    transports: c.transports,
    type: c.deviceType === "multiDevice" ? "synced" : "device-bound",
    backedUp: c.backedUp,
    aaguid: c.aaguid === ZERO_AAGUID ? "Not disclosed" : c.aaguid,
    createdAt: c.createdAt,
    lastUsedAt: c.lastUsedAt,
  };
}

// ── Registration ────────────────────────────────────────────────────────────
export async function registrationOptions(request: Request, input: PasskeyRegisterInput) {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!(name && email?.includes("@"))) {
    throw new MockRpError("Enter a name and a valid email.");
  }
  const rp = relyingPartyFor(request);
  const existing = store.findUserByEmail(email);
  // The WebAuthn user handle is random bytes, never the email (spec recommendation).
  const user = existing ?? {
    id: isoBase64URL.fromBuffer(randomBytes(32)),
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  store.saveUser(user);

  const options = await generateRegistrationOptions({
    rpName: rp.name,
    rpID: rp.id,
    userID: isoBase64URL.toBuffer(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: ATTESTATION,
    excludeCredentials: store
      .credentialsForUser(user.id)
      .map((c) => ({ id: c.id, transports: c.transports })),
    authenticatorSelection: { residentKey: RESIDENT_KEY, userVerification: USER_VERIFICATION },
  });
  await issueChallenge({ challenge: options.challenge, purpose: "register", userId: user.id });
  return options;
}

export async function registrationVerify(
  request: Request,
  response: RegistrationResponseJSON
): Promise<PasskeyRegisterResult> {
  const rp = relyingPartyFor(request);
  const pending = await consumeChallenge("register");
  const user = pending.userId ? store.getUser(pending.userId) : undefined;
  if (!user) {
    throw new MockRpError("Unknown user for this challenge.");
  }

  const verification = await verified(() =>
    verifyRegistrationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      requireUserVerification: USER_VERIFICATION === "required",
    })
  );
  if (!verification.verified) {
    throw new MockRpError("Registration could not be verified.", 401);
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
    verification.registrationInfo;
  const stored: StoredCredential = {
    id: credential.id,
    userId: user.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    aaguid,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };
  store.saveCredential(stored);
  await setSession(user.id);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    credential: summarize(stored),
  };
}

// ── Authentication ──────────────────────────────────────────────────────────
export async function authenticationOptions(request: Request) {
  const rp = relyingPartyFor(request);
  // No allowCredentials: rely on discoverable credentials so the browser
  // offers every passkey it holds for this RP ID (no username needed).
  const options = await generateAuthenticationOptions({
    rpID: rp.id,
    userVerification: USER_VERIFICATION,
  });
  await issueChallenge({ challenge: options.challenge, purpose: "login" });
  return options;
}

export async function authenticationVerify(
  request: Request,
  response: AuthenticationResponseJSON
): Promise<PasskeyLoginResult> {
  const rp = relyingPartyFor(request);
  const pending = await consumeChallenge("login");
  const stored = store.getCredential(response.id);
  if (!stored) {
    throw new MockRpError("This passkey is not registered here (was the demo reset?).", 404);
  }
  const user = store.getUser(stored.userId);
  if (!user) {
    throw new MockRpError("The passkey's user no longer exists.", 404);
  }

  const verification = await verified(() =>
    verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      requireUserVerification: USER_VERIFICATION === "required",
      credential: {
        id: stored.id,
        publicKey: isoBase64URL.toBuffer(stored.publicKey),
        counter: stored.counter,
        transports: stored.transports,
      },
    })
  );
  if (!verification.verified) {
    throw new MockRpError("Sign-in could not be verified.", 401);
  }

  const updated: StoredCredential = {
    ...stored,
    counter: verification.authenticationInfo.newCounter,
    deviceType: verification.authenticationInfo.credentialDeviceType,
    backedUp: verification.authenticationInfo.credentialBackedUp,
    lastUsedAt: new Date().toISOString(),
  };
  store.saveCredential(updated);
  await setSession(user.id);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    credential: summarize(updated),
  };
}

// ── Reset ───────────────────────────────────────────────────────────────────
export async function resetDemo(request: Request): Promise<{ rpID: string; userIDs: string[] }> {
  const userIDs = store.allUserIds();
  store.reset();
  challenges.clear();
  await clearSession();
  return { rpID: relyingPartyFor(request).id, userIDs };
}
