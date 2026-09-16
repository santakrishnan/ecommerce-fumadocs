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
  /** GET → PasskeyCredentialSummary[] for the signed-in user */
  list: "/passkeys",
  /** PATCH /passkeys/:id { nickname } → PasskeyCredentialSummary; DELETE /passkeys/:id → PasskeyRevokeResult */
  item: "/passkeys",
} as const;

/** Which authenticators the "Choose where to save your passkey" sheet offers. */
export type PasskeyAttachment = "any" | "platform" | "cross-platform";

/** WebAuthn L3 hints: order/prefer authenticator kinds without excluding any. */
export type PasskeyHint = "client-device" | "security-key" | "hybrid";

export type PasskeyRequirement = "required" | "preferred" | "discouraged";

/**
 * Registration policy — the knobs behind the "where to save" sheet.
 *
 * In production the relying party OWNS this policy; it is included in the
 * request only so the demo can switch policies live. A real backend should
 * ignore (or validate against an allow-list) anything the client sends here.
 */
export interface PasskeyRegistrationPolicy {
  /** `platform` = device keychain only; `cross-platform` = security key / phone only; `any` = all. */
  attachment?: PasskeyAttachment;
  /** Preference order shown first in the sheet; ignored by browsers that predate hints. */
  hints?: PasskeyHint[];
  /** Discoverable credential — `required` enables sign-in without a username. */
  residentKey?: PasskeyRequirement;
  /** Biometric / PIN. */
  userVerification?: PasskeyRequirement;
}

export const DEFAULT_REGISTRATION_POLICY: Required<PasskeyRegistrationPolicy> = {
  attachment: "any",
  hints: ["client-device"],
  residentKey: "required",
  userVerification: "required",
};

export interface PasskeyRegisterInput {
  email: string;
  name: string;
  /** Demo-only override of the RP's registration policy (see PasskeyRegistrationPolicy). */
  policy?: PasskeyRegistrationPolicy;
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
  /** Authenticator model name resolved from the AAGUID ("iCloud Keychain", "1Password"); null if undisclosed. */
  authenticatorName: string | null;
  backedUp: boolean;
  /** Signature counter, used to detect cloned authenticators. */
  counter: number;
  createdAt: string;
  id: string;
  lastUsedAt: string | null;
  /** Display label: nickname if set, else "<authenticator> · <platform> · added <date>". */
  name: string;
  /** User-chosen label, or null. */
  nickname: string | null;
  /** Browser and OS that registered the passkey ("Safari on iPhone"), or null. */
  platformLabel: string | null;
  /** COSE public key, base64url. */
  publicKey: string;
  transports: string[];
  type: PasskeyType;
}

export interface PasskeyRegisterResult {
  credential: PasskeyCredentialSummary;
  /** RP ID the passkey is bound to; needed for the Signal API. */
  rpID: string;
  user: PasskeyUser;
}

export interface PasskeyLoginResult {
  credential: PasskeyCredentialSummary;
  rpID: string;
  user: PasskeyUser;
}

export interface PasskeySession {
  rpID: string;
  user: PasskeyUser | null;
}

export interface PasskeyRenameInput {
  nickname: string | null;
}

export interface PasskeyRevokeResult {
  /** IDs still valid for this user; pass to the Signal API so the authenticator hides the rest. */
  remainingIds: string[];
  revokedId: string;
}

export interface PasskeyErrorBody {
  error: string;
}
