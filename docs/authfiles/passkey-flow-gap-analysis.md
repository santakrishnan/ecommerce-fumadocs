# Passkey Registration Options – Observations & Questions

Oct 15, 2026

Based on our integration with the Passkey (EDI / Auth0 Native Passkeys) flow, below are a few observations and questions we would like to discuss.

## Response received

This is the upstream register challenge as returned to us (EDI Dev tenant).

```json
{
  "authn_params_public_key": {
    "challenge": "X60xaSfMV0ZCiMCvn61R6-V0Kim9bJgieMMMxUO9QZE",
    "timeout": 60000,
    "rp": { "id": "autharrowpoc.toyotafinancial.com", "name": "autharrowpoc.toyotafinancial.com" },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -8 },
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "authenticatorSelection": { "residentKey": "required", "userVerification": "preferred" },
    "user": { "id": "QOoF…VKTw", "name": "+1415…", "displayName": "+1415…" }
  },
  "auth_session": "GWuf…WIyP",
  "authentication_method_id": null
}
```

The user handle, phone number and session are shortened here; the full values are in the original capture.

## Attribute comparison

The standard column follows W3C WebAuthn Level 3 and the [MDN reference](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions).

| Attribute | Auth0 response | Standard / recommended | Status |
| --- | --- | --- | --- |
| `excludeCredentials` | Not sent | List the user's registered credentials so one authenticator can't register twice | Gap |
| `authenticatorSelection.userVerification` | `preferred` | `required` when the passkey stands in for MFA (spec default is `preferred`) | Gap |
| `authenticatorSelection.requireResidentKey` | Not sent | `true` if and only if `residentKey` is `required` (Level 1 browser compatibility) | Gap |
| `extensions.credProps` | Not sent | Request it to learn whether a discoverable credential was actually created | Gap |
| `timeout` | 60,000 ms | 300,000 ms default, 300,000–600,000 ms range when UV is preferred or required | Weak |
| `rp.name` | Same as `rp.id` (a hostname) | Human-readable brand shown in the passkey prompt, e.g. "Toyota Financial Services" | Weak |
| `user.displayName` | Phone number | Friendly name the user recognises; `name` already carries the identifier | Weak |
| `rp.id` | `autharrowpoc.toyotafinancial.com` | Must equal, or be a registrable suffix of, the web app's origin; fixed for the life of every passkey | Check |
| `attestation` | Not sent, and no Auth0 setting to change it (defaults to `none`) | `none` for consumer sign-in; `direct` only if device policy or audit needs it | Check |
| `user.id` | 64 random bytes | Random, no PII, ≤ 64 bytes, and the same value for every registration by one user | Check |

## Observations in detail

### 1. `excludeCredentials` not sent — High

- **Risk:** A shopper who taps "Create passkey" twice on the same phone or laptop silently overwrites or duplicates the passkey. Auth0 ends up holding a credential the device no longer has, and sign-in fails with no clear error.
- **Standard:** The relying party lists the user's existing credential IDs; the browser then refuses with `InvalidStateError` before creating a duplicate ([MDN](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions), [Yubico guide](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/WebAuthn_Client_Registration.html)).
- **Ask:** Populate `excludeCredentials` with `{ type, id, transports }` for every passkey already on the user.

### 2. `userVerification: "preferred"` — High

- **Risk:** With `preferred`, an authenticator that can't do biometrics or a PIN (for example a basic security key) still registers. That passkey proves possession only, so it is one factor, not the phishing-resistant MFA a finance site usually claims.
- **Standard:** `preferred` is the spec default, not a recommendation for financial services. When the RP needs verification it sets `required` and checks the UV flag at verify time.
- **Ask:** Set `required` on register and sign-in options, and confirm the Auth0 verify step rejects a response whose UV flag is not set. The Auth0 [passkey policy](https://auth0.com/docs/authenticate/database-connections/passkeys/configure-passkey-policy) page does not list a UV setting, so this may need Auth0 support.

### 3. RP ID tied to a POC host — High (confirm)

- **Risk:** Every passkey is bound to its RP ID forever. `autharrowpoc.toyotafinancial.com` only works if the web app is served from that host or a subdomain of it; anywhere else the browser throws `SecurityError`. Passkeys created against a POC host cannot move to the production domain later.
- **Standard:** The RP ID is the app's own domain or its registrable parent (e.g. `toyotafinancial.com`), or other origins are declared through Related Origin Requests (`/.well-known/webauthn`).
- **Ask:** Which domain does the shopper-facing app run on, and what will the production RP ID be? Auth0 sets it in Tenant Settings ([Native Passkeys API](https://auth0.com/docs/native-passkeys-api)).

### 4. `timeout` of 60 seconds — Medium

- **Risk:** Cross-device registration (scan a QR code, unlock the phone, confirm) regularly takes longer than a minute. Users who need more time, including assistive-technology users, get a generic failure.
- **Standard:** WebAuthn Level 3 §15.1 recommends a 300,000 ms default within 300,000–600,000 ms when UV is preferred or required ([W3C](https://www.w3.org/TR/webauthn-3/)).
- **Ask:** 300,000 ms, with the server-side challenge lifetime at least as long.

### 5. Smaller items — Low

- **`rp.name` is a hostname.** Some browsers and password managers show it in the prompt and the saved-passkey list. Use the brand name.
- **`user.displayName` is the phone number.** It is stored on the device and shown in the account picker; a first name or masked number is friendlier and exposes less.
- **`requireResidentKey` missing.** Older browsers that only understand Level 1 ignore `residentKey`; MDN says set `requireResidentKey: true` whenever `residentKey` is `required`.
- **`credProps` not requested.** Without it the server can't tell whether the browser actually created a discoverable credential.
- **`attestation` absent.** Defaults to `none`, which is fine for consumer sign-in. Confirm no compliance requirement for `direct`.

### 6. Register/verify rejects standard WebAuthn response fields — High

- **What we found:** When we post the completed ceremony to `/passkeys/register/complete`, EDI rejects the body with `ESS-EDI-234` unless we **strip four fields** from `authn_response.response`: `authenticatorData`, `publicKey`, `publicKeyAlgorithm`, and `transports`. These are standard members of the WebAuthn Level 3 `RegistrationResponseJSON` that the browser produces via `PublicKeyCredential.toJSON()` — our client is not adding anything non-standard. With the correct origin (port fixed), the full response still fails and only the stripped response succeeds, so this is a schema rejection, not an origin issue.
- **Why it's safe for register (today):** On a registration response the dropped fields are all derivable from `attestationObject`, so stripping them is lossless for attestation verification. We only keep this workaround because EDI rejects the full shape.
- **Why it's risky for sign-in:** On an authentication (assertion) response there is no `attestationObject`. `authenticatorData` and `signature` **are** the signed data and cannot be dropped, so we strip only `publicKeyAlgorithm`/`publicKey`/`transports` there. If EDI's authenticate/complete applies the same strict schema and also rejects `authenticatorData`, sign-in cannot work at all.
- **Standard:** A spec-compliant relying party ignores unknown/additional members under `response` rather than failing. `authenticatorData`, `publicKey`, and `publicKeyAlgorithm` were added by WebAuthn Level 3 (via `getAuthenticatorData()` / `getPublicKey()` / `getPublicKeyAlgorithm()`); `transports` comes from `getTransports()`.
- **Ask:** Why does EDI reject these standard fields, and can the register/complete and authenticate/complete schemas be relaxed to accept (and ignore) additional properties under `response`? Stripping fields client-side to satisfy the gateway is a temporary workaround we want to remove.

### 7. `user_profile.name` on register start — Clarify

- **What we found:** The register **start** call takes a `user_profile` with a contact field (`email` or `phone`) and a `name`. We currently send the shopper's verified OTP contact as both the contact and the `name` (we don't collect a separate display name during OTP).
- **Question:** What does EDI use `name` for? Is it the account identifier, the WebAuthn `user.name`, the `user.displayName`, a profile label, or is it ignored? This matters because of the PII issue below, and because the register response echoes a phone number into `user.name` / `user.displayName`.
- **Ask:** Confirm the purpose and storage of `user_profile.name`, and whether it is safe (and expected) to send an email/phone there, or whether EDI prefers a non-PII value.

### 8. PII exposure: phone number shown in the passkey prompt — High (privacy)

- **What we found:** When the shopper used **phone** for OTP, we send that phone number in `user_profile` on register start. EDI then returns it in `authn_params_public_key.user.name` and `user.displayName`. The browser's `navigator.credentials.create()` prompt (and the saved-passkey list in the OS/password manager) **displays `user.displayName` / `user.name` verbatim — so the raw phone number is shown in the system passkey dialog** and persisted on the device.
- **Risk:** The raw phone number is PII. Showing it in a native OS dialog and storing it in the device/credential-manager passkey list is a privacy exposure we would not accept for a finance product, and it is visible to anyone who can see the screen or the saved-passkeys list.
- **Standard:** `user.name` should be a human-friendly account identifier and `user.displayName` a friendly label; neither needs to be raw PII. A masked value (e.g. `•••-•••-4567`) or the account's chosen name is preferred.
- **Ask:** Can EDI set `user.displayName` (and ideally `user.name`) to a masked or non-PII value rather than the raw phone/email? If EDI derives these from the `user_profile` we send, what value should we send so the prompt does not display raw PII?

### 9. Passkey not returned by the EDI profile endpoint — Clarify

- **What we found:** After a successful registration, the EDI **profile** endpoint does not include the newly mapped passkey; we have to call a separate passkey-specific API to list the shopper's credentials. This forces an extra round trip and complicates `/resolve`, which needs `hasPasskey` + the credential list to drive the sign-in UI.
- **Question:** Why is the registered passkey not reflected in the profile response? Is the separate call by design, or is profile expected to include passkey/authenticator metadata (presence, AAGUID, device label, `isThisDevice`)?
- **Ask:** Can the profile endpoint include passkey/authenticator summary data so a single resolve call can report `hasPasskey` and the credential list, avoiding a second API call on every resolve?

## Questions for the EDI / Auth0 team

- [ ] Can the register challenge include `excludeCredentials` with the user's existing passkeys? If Auth0 can't, can EDI add it before returning the options?
- [ ] Can `userVerification` be set to `required` for register and sign-in, and does verify reject a response without the UV flag?
- [ ] Can `timeout` be raised to 300,000 ms, with `auth_session` living at least as long?
- [ ] Can `rp.name` be the brand name, and `user.displayName` something other than the raw phone number?
- [ ] Can `requireResidentKey: true` and `extensions.credProps: true` be added?
- [ ] Is `attestation: none` acceptable to security and compliance? Auth0 has no attestation setting, so a device allow-list would need Auth0 support or EDI-side checks.
- [ ] Is `user.id` the same value every time one user registers, including on a second device?
- [ ] What is `auth_session`'s TTL, is it single use, and is it bound to the `edi-session-id`?
- [ ] What does `authentication_method_id` hold, and when is it non-null?
- [ ] What error codes does verify return for expired, duplicate and failed registrations?
- [ ] Why does register/complete reject the standard WebAuthn `response` fields (`authenticatorData`, `publicKey`, `publicKeyAlgorithm`, `transports`) with `ESS-EDI-234`? Can the schema accept/ignore additional properties so we can stop stripping them client-side? Does authenticate/complete apply the same schema (it must keep `authenticatorData` + `signature`)?
- [ ] What does EDI use the register-start `user_profile.name` for (account id, `user.name`, `user.displayName`, label, or ignored)? What value should we send?
- [ ] Can `user.displayName` / `user.name` be a masked or non-PII value? Today a phone-based signup shows the raw phone number in the browser's `navigator.credentials.create()` prompt and in the saved-passkey list — a PII exposure. If EDI derives these from `user_profile`, what should we send to avoid it?
- [ ] Why does the EDI profile endpoint not include the registered passkey, requiring a separate API call? Can profile return passkey/authenticator summary data (presence, AAGUID, device label, `isThisDevice`) so a single resolve reports `hasPasskey` and the credential list?

## Sources

- [Native Passkeys API](https://auth0.com/docs/native-passkeys-api) — Auth0, register challenge response shape
- [Configure Passkey Policy](https://auth0.com/docs/authenticate/database-connections/passkeys/configure-passkey-policy) — Auth0 dashboard settings
- [Map Passkey AAGUIDs to Authenticators](https://support.auth0.com/center/s/article/map-passkey-aaguids-to-authenticators-in-auth0) — Auth0 support, AAGUID storage
- [Configure WebAuthn with Security Keys for MFA](https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn/configure-webauthn-security-keys-for-mfa) — Auth0, UV setting for MFA keys
- [Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/) — W3C
- [PublicKeyCredentialCreationOptions](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions) — MDN, field definitions and defaults
- [WebAuthn Client Registration](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/WebAuthn_Client_Registration.html) — Yubico developer guide
- [Timeout recommendations discussion (#1908)](https://lists.w3.org/Archives/Public/public-webauthn/2023Jun/0097.html) — W3C WebAuthn working group
