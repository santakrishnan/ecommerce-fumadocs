"use client";

/**
 * "Is there a passkey for this site?" cannot be asked; it can only be
 * invited in ways that stay silent when there is none. Three layers, used in
 * order by `usePasskeyNudge`:
 *   1. immediate mediation  (newest; rejects instantly when no passkey)
 *   2. conditional UI       (autofill on the email field; broadest support)
 *   3. relying-party hint   (a cookie the RP sets after a platform passkey was used here)
 */

import { devConsole } from "@shared/lib/dev-console";
import { startAuthentication, WebAuthnAbortService } from "@simplewebauthn/browser";
import { getPasskeyApiBase } from "./client";
import {
  PASSKEY_ENDPOINTS,
  type PasskeyLoginResult,
  type PublicKeyCredentialRequestOptionsJSON,
} from "./contract";

export interface PasskeyCapabilities {
  conditionalGet: boolean;
  hybridTransport: boolean;
  immediateGet: boolean;
  passkeyPlatformAuthenticator: boolean;
  /** Raw map from `PublicKeyCredential.getClientCapabilities()` when available. */
  raw: Record<string, boolean>;
  userVerifyingPlatformAuthenticator: boolean;
}

interface PublicKeyCredentialStatics {
  getClientCapabilities?: () => Promise<Record<string, boolean>>;
  isConditionalMediationAvailable?: () => Promise<boolean>;
  isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
  parseRequestOptionsFromJSON?: (
    json: PublicKeyCredentialRequestOptionsJSON
  ) => PublicKeyCredentialRequestOptions;
}

function statics(): PublicKeyCredentialStatics | null {
  if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
    return null;
  }
  return window.PublicKeyCredential as unknown as PublicKeyCredentialStatics;
}

/** Feature detection. Never assume support: read this before choosing a layer. */
export async function getPasskeyCapabilities(): Promise<PasskeyCapabilities> {
  const pk = statics();
  const empty: Record<string, boolean> = {};
  const raw: Record<string, boolean> = pk?.getClientCapabilities
    ? await pk.getClientCapabilities().catch(() => empty)
    : empty;
  const conditionalGet =
    raw.conditionalGet ??
    (await pk?.isConditionalMediationAvailable?.().catch(() => false)) ??
    false;
  const uvpa =
    raw.userVerifyingPlatformAuthenticator ??
    (await pk?.isUserVerifyingPlatformAuthenticatorAvailable?.().catch(() => false)) ??
    false;
  return {
    raw,
    conditionalGet,
    immediateGet: raw.immediateGet ?? false,
    hybridTransport: raw.hybridTransport ?? false,
    passkeyPlatformAuthenticator: raw.passkeyPlatformAuthenticator ?? uvpa,
    userVerifyingPlatformAuthenticator: uvpa,
  };
}

async function fetchLoginOptions(): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const response = await fetch(`${getPasskeyApiBase()}${PASSKEY_ENDPOINTS.loginOptions}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`login/options failed (${response.status})`);
  }
  return (await response.json()) as PublicKeyCredentialRequestOptionsJSON;
}

async function verifyLogin(assertion: unknown): Promise<PasskeyLoginResult> {
  const response = await fetch(`${getPasskeyApiBase()}${PASSKEY_ENDPOINTS.loginVerify}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(assertion),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `login/verify failed (${response.status})`);
  }
  return (await response.json()) as PasskeyLoginResult;
}

/** Result of an immediate-mediation attempt. */
export type ImmediateOutcome =
  | { kind: "signed-in"; result: PasskeyLoginResult }
  | { kind: "no-passkey" }
  | { kind: "unsupported" }
  | { kind: "cancelled" }
  | { kind: "error"; message: string };

/**
 * Layer 1. `mediation: "immediate"`: the browser shows the passkey sheet at
 * once if it holds one for this RP ID, otherwise rejects with NotAllowedError
 * and no UI. SimpleWebAuthn 14 has no flag for it, so this is a direct call.
 */
export async function signInWithPasskeyImmediate(): Promise<ImmediateOutcome> {
  const pk = statics();
  if (!pk?.parseRequestOptionsFromJSON) {
    return { kind: "unsupported" };
  }
  const optionsJSON = await fetchLoginOptions();
  const publicKey = pk.parseRequestOptionsFromJSON(optionsJSON);
  // Cancel any pending conditional-UI request; only one WebAuthn call may be active.
  WebAuthnAbortService.cancelCeremony();
  devConsole.log(
    '[passkey nudge] navigator.credentials.get({ mediation: "immediate" })',
    optionsJSON
  );
  try {
    const credential = (await navigator.credentials.get({
      publicKey,
      // Not yet in the TS lib's CredentialMediationRequirement union.
      mediation: "immediate" as CredentialMediationRequirement,
    })) as PublicKeyCredential | null;
    if (!credential) {
      return { kind: "no-passkey" };
    }
    const json = (credential as PublicKeyCredential & { toJSON: () => unknown }).toJSON();
    return { kind: "signed-in", result: await verifyLogin(json) };
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      // Immediate mediation rejects instantly when there is no passkey; a user
      // dismissing the sheet raises the same error, so we treat both as "not now".
      return { kind: "no-passkey" };
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      return { kind: "cancelled" };
    }
    return { kind: "error", message: error instanceof Error ? error.message : "Unexpected error" };
  }
}

/**
 * Layer 2. Conditional UI: arm a pending request so the email field's
 * autofill bar offers passkeys (`autocomplete="username webauthn"` on the
 * input). Resolves only when the user picks one; abort it on unmount or when
 * another ceremony starts.
 */
export async function armPasskeyAutofill(): Promise<PasskeyLoginResult> {
  const optionsJSON = await fetchLoginOptions();
  devConsole.log(
    '[passkey nudge] navigator.credentials.get({ mediation: "conditional" }) armed',
    optionsJSON
  );
  const assertion = await startAuthentication({ optionsJSON, useBrowserAutofill: true });
  return verifyLogin(assertion);
}

export function cancelPasskeyAutofill(): void {
  WebAuthnAbortService.cancelCeremony();
}

/**
 * Layer 3. The RP sets a non-httpOnly `passkey-hint` cookie after a platform
 * passkey was created or used from this browser. Reading it is an inference,
 * not a detection, but it works in every browser today.
 */
export const PASSKEY_HINT_COOKIE = "passkey-hint";
const HINT_PATTERN = /(?:^|; )passkey-hint=([^;]*)/;

export function readPasskeyHint(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return HINT_PATTERN.exec(document.cookie)?.[1] === "platform";
}
