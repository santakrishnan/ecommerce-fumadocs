/**
 * Passkey API contract — KEEP.
 *
 * The browser client (`./client.ts`) is written against this contract. Hand
 * this file to the backend team: it defines four endpoints using the
 * WebAuthn Level 3 JSON format (`PublicKeyCredential*OptionsJSON`,
 * `RegistrationResponseJSON`, `AuthenticationResponseJSON`), so any server
 * library works behind it (SimpleWebAuthn, java-webauthn-server, Fido2NetLib,
 * go-webauthn, py_webauthn…).
 *
 * The challenge is bound to an httpOnly cookie set by the *options* call and
 * read by the matching *verify* call, so the two must share an origin (or the
 * backend must allow credentialed CORS from the app origin).
 */

export type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

/** Relative to the API base (`NEXT_PUBLIC_PASSKEY_API_BASE`, default `/api/auth/passkey`). */
export const PASSKEY_ENDPOINTS = {
  /** POST { name, email } → PublicKeyCredentialCreationOptionsJSON (+ challenge cookie) */
  registerOptions: "/register/options",
  /** POST RegistrationResponseJSON → PasskeyRegisterResult */
  registerVerify: "/register/verify",
  /** POST {} → PublicKeyCredentialRequestOptionsJSON (+ challenge cookie) */
  loginOptions: "/login/options",
  /** POST AuthenticationResponseJSON → PasskeyLoginResult */
  loginVerify: "/login/verify",
} as const;

export interface PasskeyRegisterInput {
  email: string;
  name: string;
}

export interface PasskeyUser {
  email: string;
  id: string;
  name: string;
}

/** "synced" = backed up to a cloud keychain / password manager; "device-bound" = lives on one authenticator. */
export type PasskeyType = "synced" | "device-bound";

/** What the relying party stores about a passkey. Never contains a private key. */
export interface PasskeyCredentialSummary {
  /** Authenticator model id; all-zero for privacy-preserving authenticators (shown as "Not disclosed"). */
  aaguid: string;
  backedUp: boolean;
  /** Signature counter, used to detect cloned authenticators. */
  counter: number;
  createdAt: string;
  id: string;
  lastUsedAt: string | null;
  /** COSE public key, base64url. */
  publicKey: string;
  transports: string[];
  type: PasskeyType;
}

export interface PasskeyRegisterResult {
  credential: PasskeyCredentialSummary;
  user: PasskeyUser;
}

export interface PasskeyLoginResult {
  credential: PasskeyCredentialSummary;
  user: PasskeyUser;
}

export interface PasskeyErrorBody {
  error: string;
}
