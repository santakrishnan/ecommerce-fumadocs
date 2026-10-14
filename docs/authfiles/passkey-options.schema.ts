import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { z } from "zod";

// Hand-rolled mirror of the Visitor Profile Service (VPS) passkey ceremony
// contract (`PasskeyOptionsRequest` / `PasskeyOptionsResponse`).

/**
 * `register-options` enrolls a new passkey (requires T1); `login-options` starts
 * a passkey sign-in (open to T0, it is how a shopper reaches T2).
 */
export const PASSKEY_OPTIONS_ACTIONS = ["register-options", "login-options"] as const;
export type PasskeyOptionsAction = (typeof PASSKEY_OPTIONS_ACTIONS)[number];

export const passkeyOptionsRequestSchema = z.object({
  action: z.enum(PASSKEY_OPTIONS_ACTIONS),
});

export type PasskeyOptionsRequest = z.infer<typeof passkeyOptionsRequestSchema>;

/**
 * Response payload. Mirrors `PasskeyOptionsResponse.data`: the WebAuthn creation
 * options the browser passes to `navigator.credentials.create()`, plus the
 * opaque `authSession` handle.
 */
export interface PasskeyOptionsResponse {
  authSession: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

/** `login-options` payload: WebAuthn request options for `navigator.credentials.get()`. */
export interface PasskeySignInOptionsResponse {
  authSession: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

/**
 * Client-safe schema for the `{ data }` envelope the BFF returns from
 * `POST /api/v1/auth/passkey`. `options` is passed straight to the browser's
 * `startRegistration`, which does the real WebAuthn validation, so here we only
 * assert the envelope shape and that `options`/`authSession` are present.
 */
export const passkeyOptionsEnvelopeSchema = z.object({
  data: z.object({
    options: z.looseObject({ challenge: z.string().min(1) }),
    authSession: z.string().min(1),
  }),
});
