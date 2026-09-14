"use client";

/**
 * Browser-side passkey client — KEEP.
 *
 * Runs the two WebAuthn ceremonies with `@simplewebauthn/browser` and talks
 * to whatever implements `contract.ts` — today the mock relying party in
 * `./mock-server` on the dev-only `/api/auth/passkey/*` routes, later the
 * upstream BED service at the same path (or via NEXT_PUBLIC_PASSKEY_API_BASE).
 */

import { clientEnv } from "@config/client-env";
import {
  browserSupportsWebAuthn,
  sendSignal,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import {
  PASSKEY_ENDPOINTS,
  type PasskeyErrorBody,
  type PasskeyLoginResult,
  type PasskeyRegisterInput,
  type PasskeyRegisterResult,
  type PasskeyUser,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "./contract";

export const DEFAULT_PASSKEY_API_BASE = "/api/auth/passkey";

export function getPasskeyApiBase(): string {
  return clientEnv.NEXT_PUBLIC_PASSKEY_API_BASE ?? DEFAULT_PASSKEY_API_BASE;
}

export class PasskeyApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PasskeyApiError";
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getPasskeyApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The challenge lives in an httpOnly cookie set by the options call.
    credentials: "same-origin",
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as PasskeyErrorBody;
      if (data.error) {
        message = data.error;
      }
    } catch {
      // keep the generic message
    }
    throw new PasskeyApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export function passkeysSupported(): boolean {
  return browserSupportsWebAuthn();
}

/** Ceremony 1: create a passkey for a new user and register it with the RP. */
export async function registerPasskey(input: PasskeyRegisterInput): Promise<PasskeyRegisterResult> {
  const optionsJSON = await post<PublicKeyCredentialCreationOptionsJSON>(
    PASSKEY_ENDPOINTS.registerOptions,
    input
  );
  const registration = await startRegistration({ optionsJSON });
  return post<PasskeyRegisterResult>(PASSKEY_ENDPOINTS.registerVerify, registration);
}

/**
 * Ceremony 2: sign in with an existing passkey. No username needed — the
 * options request discoverable credentials, so the browser lists the user's
 * passkeys for this RP ID.
 */
export async function signInWithPasskey(): Promise<PasskeyLoginResult> {
  const optionsJSON = await post<PublicKeyCredentialRequestOptionsJSON>(
    PASSKEY_ENDPOINTS.loginOptions,
    {}
  );
  const assertion = await startAuthentication({ optionsJSON });
  return post<PasskeyLoginResult>(PASSKEY_ENDPOINTS.loginVerify, assertion);
}

/** MOCK-ONLY (remove when the upstream API lands): who the demo session cookie says is signed in. */
export async function getPasskeySession(): Promise<PasskeyUser | null> {
  const response = await fetch(`${getPasskeyApiBase()}/session`, { credentials: "same-origin" });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { user: PasskeyUser | null };
  return data.user;
}

/**
 * MOCK-ONLY (remove when the upstream API lands): wipe the store, then ask the password manager to hide passkeys
 * the RP no longer knows (Signal API — a no-op where unsupported).
 */
export async function resetPasskeyDemo(): Promise<void> {
  const data = await post<{ rpID: string; userIDs: string[] }>("/reset", {});
  await Promise.all(
    data.userIDs.map((userID) =>
      sendSignal({
        signalName: "allAcceptedCredentials",
        rpID: data.rpID,
        userID,
        allAcceptedCredentialIDs: [],
      }).catch(() => undefined)
    )
  );
}

/** Human-readable reason for a failed ceremony. */
export function describePasskeyError(error: unknown): string {
  if (error instanceof WebAuthnError) {
    switch (error.code) {
      case "ERROR_CEREMONY_ABORTED":
        return "The passkey prompt was cancelled.";
      case "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED":
        return "A passkey for this account already exists on this authenticator.";
      case "ERROR_INVALID_DOMAIN":
        return "Passkeys need a secure origin (HTTPS, or localhost).";
      default:
        return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}
