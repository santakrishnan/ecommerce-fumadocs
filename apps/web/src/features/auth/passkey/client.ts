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
  type PasskeyCredentialSummary,
  type PasskeyErrorBody,
  type PasskeyLoginResult,
  type PasskeyRegisterInput,
  type PasskeyRegisterResult,
  type PasskeyRevokeResult,
  type PasskeySession,
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

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${getPasskeyApiBase()}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    // The challenge lives in an httpOnly cookie set by the options call.
    credentials: "same-origin",
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
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

const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);

export function passkeysSupported(): boolean {
  return browserSupportsWebAuthn();
}

export interface RegisterPasskeyHooks {
  /** Receives the creation options exactly as handed to the browser (useful to show what drove the sheet). */
  onOptions?: (options: PublicKeyCredentialCreationOptionsJSON) => void;
}

/** Ceremony 1: create a passkey for a new user and register it with the RP. */
export async function registerPasskey(
  input: PasskeyRegisterInput,
  hooks: RegisterPasskeyHooks = {}
): Promise<PasskeyRegisterResult> {
  const optionsJSON = await post<PublicKeyCredentialCreationOptionsJSON>(
    PASSKEY_ENDPOINTS.registerOptions,
    input
  );
  hooks.onOptions?.(optionsJSON);
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

/** Passkeys registered for the signed-in user (the RP's records; the device is never enumerated). */
export function listPasskeys(): Promise<PasskeyCredentialSummary[]> {
  return request<PasskeyCredentialSummary[]>("GET", PASSKEY_ENDPOINTS.list);
}

export function renamePasskey(
  id: string,
  nickname: string | null
): Promise<PasskeyCredentialSummary> {
  return request<PasskeyCredentialSummary>(
    "PATCH",
    `${PASSKEY_ENDPOINTS.item}/${encodeURIComponent(id)}`,
    {
      nickname,
    }
  );
}

/**
 * Revoke a passkey on the RP, then tell the authenticator which credentials
 * are still accepted so the password manager hides the revoked one
 * (Signal API; best effort, ignored where unsupported).
 */
export async function revokePasskey(
  id: string,
  rpID: string,
  userID: string
): Promise<PasskeyRevokeResult> {
  const result = await request<PasskeyRevokeResult>(
    "DELETE",
    `${PASSKEY_ENDPOINTS.item}/${encodeURIComponent(id)}`
  );
  await sendSignal({
    signalName: "allAcceptedCredentials",
    rpID,
    userID,
    allAcceptedCredentialIDs: result.remainingIds,
  }).catch(() => undefined);
  return result;
}

/** MOCK-ONLY (remove when the upstream API lands): who the demo session cookie says is signed in. */
export async function getPasskeySession(): Promise<PasskeySession> {
  const response = await fetch(`${getPasskeyApiBase()}/session`, { credentials: "same-origin" });
  if (!response.ok) {
    return { user: null, rpID: window.location.hostname };
  }
  return (await response.json()) as PasskeySession;
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
