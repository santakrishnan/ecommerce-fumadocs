import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { z } from "zod";

// VPS passkey completion request, one body per ceremony (`action`). We assert
// the envelope and size-cap the WebAuthn fields; SimpleWebAuthn does the real
// structural check on `response`.

export const PASSKEY_VERIFY_ACTIONS = ["register", "login"] as const;
export type PasskeyVerifyAction = (typeof PASSKEY_VERIFY_ACTIONS)[number];

const BASE64URL = /^[\w-]+$/;

// Size caps keep oversized payloads away from the verifier and the logs.
const base64url = (max: number) => z.string().min(1).max(max).regex(BASE64URL);

const credentialFields = {
  id: base64url(1024),
  rawId: base64url(1024),
  type: z.literal("public-key"),
};

const passkeyRegisterRequestSchema = z.object({
  action: z.literal("register"),
  authSession: z.string().min(1).max(128),
  // Same cap as the stored passkey label (`registerStoredPasskey`).
  deviceName: z.string().trim().min(1).max(80).optional(),
  response: z.looseObject({
    ...credentialFields,
    response: z.looseObject({
      clientDataJSON: base64url(8192),
      attestationObject: base64url(65_536),
    }),
  }),
});

const passkeyLoginRequestSchema = z.object({
  action: z.literal("login"),
  authSession: z.string().min(1).max(128),
  response: z.looseObject({
    ...credentialFields,
    response: z.looseObject({
      clientDataJSON: base64url(8192),
      authenticatorData: base64url(8192),
      signature: base64url(1024),
      userHandle: base64url(1024).optional(),
    }),
  }),
});

export const passkeyVerifyRequestSchema = z.discriminatedUnion("action", [
  passkeyRegisterRequestSchema,
  passkeyLoginRequestSchema,
]);

/** `register`, with `response` narrowed to the WebAuthn registration JSON. */
export type PasskeyRegisterRequest = Omit<
  z.infer<typeof passkeyRegisterRequestSchema>,
  "response"
> & { response: RegistrationResponseJSON };

/** `login`, with `response` narrowed to the WebAuthn authentication JSON. */
export type PasskeyLoginRequest = Omit<z.infer<typeof passkeyLoginRequestSchema>, "response"> & {
  response: AuthenticationResponseJSON;
};

export type PasskeyVerifyRequest = PasskeyRegisterRequest | PasskeyLoginRequest;
