# Passkey Registration Options – Gap Analysis vs WebAuthn Standards

Oct 15, 2026

## Summary

The Auth0 registration challenge is valid WebAuthn and works in the browser, but it leaves out three attributes that matter for a financial-services passkey rollout: `excludeCredentials`, a required `userVerification`, and a realistic `timeout`. Our BFF mock already sends the first two, so those gaps show up as soon as we switch from mock to upstream; the timeout is short in both and we will fix ours too.

What we need from the EDI / Auth0 team, in priority order:

1. **Send `excludeCredentials`** with the shopper's existing passkeys, so the same device can't register twice.
2. **Set `userVerification: "required"`**, and confirm the verify step rejects responses without the UV flag.
3. **Confirm the RP ID** `autharrowpoc.toyotafinancial.com` matches the domain the web app runs on, or plan Related Origin Requests.
4. **Raise `timeout`** from 60 seconds to the 300-second range the spec recommends.
5. Smaller items: a human-readable `rp.name`, `requireResidentKey`, `attestation`, `credProps`, and the lifetime of `auth_session`.

## Response received

This is the upstream register challenge as returned to us (POC tenant). Its shape matches the register response in Auth0's [Native Passkeys API](https://auth0.com/docs/native-passkeys-api) docs, so the gaps below come from the Auth0 defaults rather than an EDI-specific change.

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

Four attributes are missing or set below the standard, three are weak, and three need confirming. The standard column follows W3C WebAuthn Level 3 and the [MDN reference](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions). The mock column is what `generateRegistrationOptions` in our BFF mock returns today.

| Attribute | Auth0 response | Our mock | Standard / recommended | Status |
| --- | --- | --- | --- | --- |
| `excludeCredentials` | Not sent | Shopper's existing passkeys | List the user's registered credentials so one authenticator can't register twice | Gap |
| `authenticatorSelection.userVerification` | `preferred` | `required` | `required` when the passkey stands in for MFA (spec default is `preferred`) | Gap |
| `authenticatorSelection.requireResidentKey` | Not sent | `true` | `true` if and only if `residentKey` is `required` (Level 1 browser compatibility) | Gap |
| `extensions.credProps` | Not sent | `true` | Request it to learn whether a discoverable credential was actually created | Gap |
| `timeout` | 60,000 ms | 60,000 ms | 300,000 ms default, 300,000–600,000 ms range when UV is preferred or required | Weak |
| `rp.name` | Same as `rp.id` (a hostname) | `UCMP` | Human-readable brand shown in the passkey prompt, e.g. "Toyota Financial Services" | Weak |
| `user.displayName` | Phone number | Shopper name | Friendly name the user recognises; `name` already carries the identifier | Weak |
| `rp.id` | `autharrowpoc.toyotafinancial.com` | Site hostname (`localhost` in dev) | Must equal, or be a registrable suffix of, the web app's origin; fixed for the life of every passkey | Check |
| `attestation` | Not sent, and no Auth0 setting to change it (defaults to `none`) | `none` | `none` for consumer sign-in; `direct` only if device policy or audit needs it | Check |
| `user.id` | 64 random bytes | 32 random bytes | Random, no PII, ≤ 64 bytes, and the same value for every registration by one user | Check |
| `challenge` | 32 random bytes | 32 random bytes | Random, ≥ 16 bytes, single use, short-lived on the server | Aligned |
| `pubKeyCredParams` | EdDSA (-8), ES256 (-7), RS256 (-257) | Same | Include ES256 and RS256, listed in preference order | Aligned |
| `authenticatorSelection.residentKey` | `required` | `required` | `required` for passkeys | Aligned |
| `user.name` | Phone number | Shopper identifier | Human-friendly account identifier; a phone number is allowed | Aligned |
| `authenticatorSelection.authenticatorAttachment` | Not sent | Not sent | Omit, so phones (QR) and security keys work as well as the built-in authenticator | Aligned |
| `hints` | Not sent | Empty | Optional (Level 3); useful later to steer the browser UI | Aligned |

## Gaps in detail

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
- **Ask:** 300,000 ms, with the server-side challenge lifetime at least as long. We will raise our mock to match.

### 5. Smaller items — Low

- **`rp.name` is a hostname.** Some browsers and password managers show it in the prompt and the saved-passkey list. Use the brand name.
- **`user.displayName` is the phone number.** It is stored on the device and shown in the account picker; a first name or masked number is friendlier and exposes less.
- **`requireResidentKey` missing.** Older browsers that only understand Level 1 ignore `residentKey`; MDN says set `requireResidentKey: true` whenever `residentKey` is `required`.
- **`credProps` not requested.** Without it the server can't tell whether the browser actually created a discoverable credential.
- **`attestation` absent.** Defaults to `none`, which is fine for consumer sign-in. Confirm no compliance requirement for `direct`.

### 6. Attestation is not configurable in Auth0 — Info

- **What we found:** The Native Passkeys API register challenge has no `attestation` field, so browsers use `none`. Neither the [Native Passkeys API](https://auth0.com/docs/native-passkeys-api) nor the [passkey policy](https://auth0.com/docs/authenticate/database-connections/passkeys/configure-passkey-policy) docs offer a setting to request or verify attestation, or to allow-list authenticators.
- **What Auth0 does keep:** It has stored the passkey's AAGUID (the provider ID, e.g. Google Password Manager, iCloud Keychain, a YubiKey) since about October 2025; older passkeys have an empty value ([Auth0 support](https://support.auth0.com/center/s/article/map-passkey-aaguids-to-authenticators-in-auth0)). Without attestation the AAGUID is self-reported, so it is fine for labels and analytics but not for enforcement.
- **Related:** Auth0's WebAuthn security-key MFA exposes a user verification setting (Never / If supported / Required) but no attestation setting either ([Auth0 docs](https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn/configure-webauthn-security-keys-for-mfa)). Passkeys have no documented UV setting, which supports raising gap 2 with Auth0 support.
- **Impact:** None for a consumer flow, where `none` is the norm. If compliance requires approved or hardware-backed authenticators only, Auth0 passkeys can't enforce it today; that needs an Auth0 support request or EDI-side attestation checks, and would exclude most synced passkeys.

## Envelope and server-side behaviour

The payload can't show how the challenge is handled after it leaves Auth0, and our BFF depends on these behaviours. Our mock enforces each one today, so they are the contract we expect upstream to match.

| Item | What we see | What our mock does | What we need confirmed |
| --- | --- | --- | --- |
| `auth_session` lifetime | No expiry field | Expires after 5 minutes | Its TTL, and that it is at least the ceremony `timeout`; ideally an `expires_at` in the response |
| Single use | Not visible | Challenge deleted on first verify attempt | A replayed `auth_session` or challenge is rejected |
| Session binding | Not visible | Challenge bound to the visitor session; another session can't redeem it | `auth_session` is bound to the `edi-session-id` / user that requested it |
| `authentication_method_id` | `null` | No equivalent | What it means on register, and whether the verify response returns the new method's ID |
| Origin check on verify | Not visible | Response checked against allowed origins and RP ID | Which origins Auth0 accepts for this tenant |
| UV flag on verify | Not visible | UV required | Verify fails when UV is not set (ties to gap 2) |
| Error contract | Not visible | 400 invalid / expired, 409 already registered | Error codes for expired session, duplicate credential and failed verification |

## Questions for the EDI / Auth0 team

- [ ] Can the register challenge include `excludeCredentials` with the user's existing passkeys? If Auth0 can't, can EDI add it before returning the options?
- [ ] Can `userVerification` be set to `required` for register and sign-in, and does verify reject a response without the UV flag?
- [ ] What is the production RP ID, and is the shopper-facing app served from that domain? If not, are Related Origin Requests planned?
- [ ] Can `timeout` be raised to 300,000 ms, with `auth_session` living at least as long?
- [ ] Can `rp.name` be the brand name, and `user.displayName` something other than the raw phone number?
- [ ] Can `requireResidentKey: true` and `extensions.credProps: true` be added?
- [ ] Is `attestation: none` acceptable to security and compliance? Auth0 has no attestation setting, so a device allow-list would need Auth0 support or EDI-side checks.
- [ ] Is `user.id` the same value every time one user registers, including on a second device?
- [ ] What is `auth_session`'s TTL, is it single use, and is it bound to the `edi-session-id`?
- [ ] What does `authentication_method_id` hold, and when is it non-null?
- [ ] What error codes does verify return for expired, duplicate and failed registrations?

## Sources

- [Native Passkeys API](https://auth0.com/docs/native-passkeys-api) — Auth0, register challenge response shape
- [Configure Passkey Policy](https://auth0.com/docs/authenticate/database-connections/passkeys/configure-passkey-policy) — Auth0 dashboard settings
- [Map Passkey AAGUIDs to Authenticators](https://support.auth0.com/center/s/article/map-passkey-aaguids-to-authenticators-in-auth0) — Auth0 support, AAGUID storage
- [Configure WebAuthn with Security Keys for MFA](https://auth0.com/docs/secure/multi-factor-authentication/fido-authentication-with-webauthn/configure-webauthn-security-keys-for-mfa) — Auth0, UV setting for MFA keys
- [Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/) — W3C
- [PublicKeyCredentialCreationOptions](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions) — MDN, field definitions and defaults
- [WebAuthn Client Registration](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/WebAuthn_Client_Registration.html) — Yubico developer guide
- [Timeout recommendations discussion (#1908)](https://lists.w3.org/Archives/Public/public-webauthn/2023Jun/0097.html) — W3C WebAuthn working group
