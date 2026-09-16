# Passkey registration options: `authenticatorSelection`, `excludeCredentials`, `attestation`

Reference for the options the relying party (RP) sends in `PublicKeyCredentialCreationOptions` when a user creates a passkey. These fields are what control the browser's "Choose where to save your passkey" sheet and what the RP learns about the authenticator. In this codebase they are produced by `features/auth/passkey/mock-server/server.ts` (`resolvePolicy()` → `generateRegistrationOptions()`), and the contract type is `PasskeyRegistrationPolicy` in `features/auth/passkey/contract.ts`.

The three things covered here answer three different questions:

| Field | Question it answers |
| --- | --- |
| `authenticatorSelection` | *Which kinds of authenticator may create this passkey, and how must the user prove presence?* |
| `excludeCredentials` | *Which authenticators already have a passkey for this user, and must not create another?* |
| `attestation` | *How much does the RP want to know about the authenticator's make and model, and with what proof?* |

---

## 1. `authenticatorSelection`

A dictionary of four members. Every member is optional; the defaults are the most permissive.

```jsonc
"authenticatorSelection": {
  "authenticatorAttachment": "platform",   // "platform" | "cross-platform" | (omitted)
  "residentKey": "required",               // "required" | "preferred" | "discouraged"
  "requireResidentKey": true,              // legacy boolean, must agree with residentKey
  "userVerification": "required"           // "required" | "preferred" | "discouraged"
}
```

### 1.1 `authenticatorAttachment`: which authenticators appear in the sheet

| Value | Meaning | What the user sees |
| --- | --- | --- |
| `"platform"` | Only the authenticator built into the device the user is on: Face ID / Touch ID with iCloud Keychain, Android with Google Password Manager, Windows Hello. | Only the device's own option. No security key, no "use another device / QR". |
| `"cross-platform"` | Only *roaming* authenticators, meaning ones that can move between devices: FIDO2 security keys (USB/NFC/BLE) and a phone acting for a laptop over the hybrid (QR) transport. | Security key and "other device" options only. The device's keychain is hidden. |
| omitted | No restriction. | Everything the platform supports, in the platform's default order. |

Notes

- This is a **hard filter**: the browser does not offer excluded kinds at all. Use it only when the policy really requires it (for example a "hardware key only" enrolment for a privileged role). For consumer sign-in, omit it and use `hints` (below) for ordering, so users with a security key or a second device are never locked out.
- Third-party password managers (1Password, Bitwarden) register with the OS as platform authenticators, so `"platform"` includes them.
- The value the authenticator actually used comes back in the registration response as `authenticatorAttachment`. It is worth storing: "this browser registered a platform passkey" is what drives the returning-user prompt.

### 1.2 `residentKey` (and `requireResidentKey`): discoverable credential or not

A *resident* (in WebAuthn L3 terms: *discoverable*) credential is one where the authenticator stores the credential and the user handle itself, so it can be found by RP ID alone. A non-discoverable credential is derived from the credential ID, so the RP must first know *who* is signing in and send that ID in `allowCredentials`.

| Value | Behaviour | Practical effect |
| --- | --- | --- |
| `"required"` | The authenticator must create a discoverable credential, or fail. | Enables **"Sign in with passkey" with no username**, conditional UI (autofill) and immediate mediation. This is what "passkey" means in product terms. |
| `"preferred"` | Create a discoverable credential if the authenticator can; otherwise create a non-discoverable one. | Maximises compatibility with old security keys that have no storage; the RP must check `credProps.rk` in the response to learn which it got. |
| `"discouraged"` | Prefer a non-discoverable credential. | Legacy second-factor style. Sign-in then always needs a username first. |

`requireResidentKey` is the WebAuthn Level 1 boolean that predates `residentKey`. The spec requires it to be `true` exactly when `residentKey` is `"required"`; browsers that only know the boolean use it, newer ones use the string. Our server sets both consistently.

Trade-off: discoverable credentials occupy a slot on hardware keys (older keys hold ~25), which is why `"preferred"` exists. For a consumer site that is a non-issue and `"required"` is the right setting.

### 1.3 `userVerification`: must the user prove *who* they are, not just that they are present

User *presence* (a touch) is always required by WebAuthn. User *verification* additionally proves identity to the authenticator: biometric, device PIN, or a security-key PIN.

| Value | Behaviour | When to use |
| --- | --- | --- |
| `"required"` | Registration fails unless the authenticator performed user verification; the response's `UV` flag must be set and the server should check it. | Anything account-grade: banking, profile, payments. Our default. |
| `"preferred"` | Ask for verification if the authenticator supports it; accept the credential either way. | Low-risk sign-in where a bare touch is acceptable on a key without a PIN. Server must read the `UV` flag and decide. |
| `"discouraged"` | Ask the authenticator not to verify (skips the PIN/biometric prompt where it can). | Pure second-factor flows where a password was already checked; rarely right for passkeys. |

Two server-side consequences: with `"required"`, `verifyRegistrationResponse({ requireUserVerification: true })` rejects a response whose `UV` flag is false; and the same setting must be applied on the *authentication* side (`generateAuthenticationOptions({ userVerification })`) or the sign-in step silently becomes weaker than enrolment.

### 1.4 `hints`: ordering without excluding (WebAuthn Level 3, sits beside `authenticatorSelection`)

Not a member of `authenticatorSelection` but used together with it. An ordered list of `"client-device"`, `"security-key"`, `"hybrid"` that tells the browser which kind the RP *prefers*; the browser leads with that option but keeps the others reachable. Older browsers ignore it. Hints let you express "put Face ID first" without the lock-out risk of `authenticatorAttachment: "platform"`. Where a hint and `authenticatorAttachment` conflict, the attachment wins because it is a hard filter.

### 1.5 Recommended combinations

| Scenario | `authenticatorAttachment` | `hints` | `residentKey` | `userVerification` |
| --- | --- | --- | --- | --- |
| Consumer sign-in (our default) | omitted | `["client-device"]` | `required` | `required` |
| Enrol a hardware key for privileged users | `cross-platform` | `["security-key"]` | `required` | `required` |
| Kiosk / shared device (bind to this device only) | `platform` | `["client-device"]` | `required` | `required` |
| Legacy 2FA key alongside a password | omitted | none | `discouraged` | `preferred` |

---

## 2. `excludeCredentials`

```jsonc
"excludeCredentials": [
  { "type": "public-key", "id": "<base64url credential id>", "transports": ["internal", "hybrid"] }
]
```

**Purpose: prevent duplicate passkeys on the same authenticator.** The RP lists every credential it already holds for this user. If the authenticator that is about to register finds one of those IDs in its own storage, it refuses (the browser surfaces `InvalidStateError`; SimpleWebAuthn maps it to `ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED`). Without it, tapping "Create a passkey" twice on the same iPhone silently creates two identical-looking entries in iCloud Keychain, which confuses users and clutters the "Your passkeys" list.

What it is **not**: it is not an allow-list and it does not enumerate what the device has (the browser never reveals stored credentials). It only lets an authenticator recognise *its own* prior credential.

Details that matter

- Populate it from the server's credential table for the user identified in `register/options`. This is why registration must know the user (email) before the ceremony. Our server does `store.credentialsForUser(user.id)`.
- Include `transports` when known; the browser uses them to decide which authenticator to consult without prompting for others.
- The list must be per-user. Sending another user's credentials would leak nothing (IDs are random) but would wrongly block registration.
- The mirror on the sign-in side is `allowCredentials`: the list of credentials the RP *accepts*. For discoverable passkeys we deliberately send an empty list so the browser offers every passkey it has for the RP ID. That is what makes sign-in without a username work.

---

## 3. `attestation`

```jsonc
"attestation": "none"   // "none" | "indirect" | "direct" | "enterprise"
```

**Purpose: decide whether the RP wants cryptographic proof of the authenticator's make and model.** During registration the authenticator can sign a statement ("this key was made by vendor X, model Y") with a vendor certificate. The RP can verify that against the FIDO Metadata Service and then, for example, refuse authenticators that are not certified, or record the model for support and risk purposes.

| Value | Behaviour | Typical use |
| --- | --- | --- |
| `"none"` | The RP does not want attestation. The browser strips or anonymises it; the response carries no vendor signature. | Consumer sites. Fastest, most private, no metadata-service dependency. **Our setting.** |
| `"indirect"` | The RP wants attestation but lets the browser anonymise it (e.g. through an anonymisation CA) to protect privacy. | Rarely used in practice; treated like `direct` or `none` by most platforms. |
| `"direct"` | The RP wants the authenticator's own attestation statement. Some platforms show the user a consent prompt because the model can be identifying. | Regulated flows that must only accept certified authenticators (FIDO-certified keys, specific security levels). Requires verifying against FIDO MDS and keeping root certificates current. |
| `"enterprise"` | Requests uniquely identifying attestation; honoured only for authenticators enrolled by an enterprise policy in a managed browser. | Corporate device fleets. Not applicable to a public consumer site. |

What you get regardless of this setting: the **AAGUID** (authenticator model identifier) is part of the authenticator data, not the attestation statement, so it is available with `"none"`. One caveat: privacy-preserving authenticators may report an all-zero AAGUID (older Apple behaviour; current iCloud Keychain reports its real AAGUID). That is why the demo shows "Not disclosed" for zeros. The AAGUID resolves to a human name ("iCloud Keychain", "YubiKey 5 NFC") via the community AAGUID list, which is enough for "Your passkeys" labels without any attestation.

Why `"none"` is the right default here: attestation adds a consent prompt on some platforms, ties the backend to certificate maintenance and the FIDO Metadata Service, and buys nothing for a consumer sign-in whose security comes from the public-key ceremony, not from the authenticator's brand. If the assurance engine ever needs "hardware-backed, certified authenticator only" for a specific tier, that tier can request `"direct"` on its own enrolment path while the consumer path stays at `"none"`.

---

## 4. How these interact with what the sheet shows

1. `authenticatorAttachment` decides **which kinds** are offered (hard filter).
2. `hints` decides **which kind is first** among those offered.
3. `residentKey` and `userVerification` decide **what the chosen authenticator must be able to do**; an authenticator that cannot meet them is skipped or fails.
4. `excludeCredentials` removes authenticators that **already hold** a passkey for this user.
5. `attestation` does not change the sheet, except that `"direct"` may add a consent prompt after the user picks.
6. The label ("for localhost") is the **RP ID** plus `rp.name`, set by the server and not by any of the above.

The demo page (`/docs/design-system/passkey`, section "Controlling the sheet") lets you switch 1–3 live and shows the options exactly as the browser received them.

---

## 5. Where each field lives in this repo

| Field | Set in | Verified in |
| --- | --- | --- |
| `authenticatorSelection`, `hints` | `mock-server/server.ts` → `resolvePolicy()` → `generateRegistrationOptions()` | `verifyRegistrationResponse({ requireUserVerification })` |
| `excludeCredentials` | `mock-server/server.ts` from `store.credentialsForUser()` | enforced by the authenticator, not the server |
| `attestation` | `ATTESTATION = "none"` in `mock-server/server.ts` | `verifyRegistrationResponse` (accepts `none`; would validate `direct`) |
| Contract type | `features/auth/passkey/contract.ts` → `PasskeyRegistrationPolicy`, `DEFAULT_REGISTRATION_POLICY` | not applicable |

When the upstream BED replaces the mock, these settings move to the BED's option generation; the contract and the client do not change.
