# WebAuthn and passkeys: what is new, and where to read about it

**Audience:** the frontend team and the BED team
**Purpose:** background for the features used in the passkey demo (`/docs/design-system/passkey`) and the approach document. Every link below was checked on 16 September 2026 and was live on that date. Where a feature is Chrome only, the table says so; support changes quickly, so re-check the "Device support" links before quoting numbers to the client.

A quick map of what is old and what is new:

| Feature | Since | Used in our code |
| --- | --- | --- |
| WebAuthn Level 3 (the spec all of this comes from) | W3C Recommendation, August 2026 | everything |
| JSON options (`parseCreationOptionsFromJSON`, `parseRequestOptionsFromJSON`, `toJSON`) | Chrome 129, Firefox 119, Safari 18.4 | `nudge.ts` immediate call; SimpleWebAuthn uses the same shapes |
| `hints` (`client-device`, `security-key`, `hybrid`) | Chrome 128 | `contract.ts` policy, `server.ts` |
| Conditional UI (passkey autofill) | Chrome 108 and Safari 16 onwards, current shape in Chrome 133, Firefox 135, Safari 17.4 (see device support) | `nudge.ts` `armPasskeyAutofill`, email field `autocomplete="username webauthn"` |
| `getClientCapabilities()` | Chrome 133, Firefox 135, Safari 17.4 | `nudge.ts` `getPasskeyCapabilities` |
| Signal API (`signalAllAcceptedCredentials` and friends) | Chrome 132, Safari 26 | `client.ts` `revokePasskey`, `resetPasskeyDemo` |
| Immediate UI mode (`uiMode: "immediate"`) | Chrome 149 only, as of September 2026 | `nudge.ts` `signInWithPasskeyImmediate` |
| Conditional create (`mediation: "conditional"` on `create()`) | Chrome 136 | not used yet; candidate for after OTP sign-in |
| AAGUID lookup (community list plus FIDO MDS) | list maintained since 2023 | `mock-server/label.ts`, `aaguids.json` |
| Related Origin Requests (`/.well-known/webauthn`) | Chrome 128 | not used yet; relevant if dealer sites share one RP ID |

---

## 1. The specification

**WebAuthn Level 3, W3C Recommendation**
https://www.w3.org/TR/webauthn-3/

This is the source of everything on this page. It became a W3C Recommendation on 25 August 2026, so it is no longer a draft. The sections worth pointing the team at:

- 5.1.3 `hints` on creation and request options.
- 5.1.7 `getClientCapabilities()`.
- 5.1.10 the signal methods (`signalUnknownCredential`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`).
- `authenticatorSelection` (attachment, resident key, user verification), which the registration options document already covers.

The editor's draft at https://w3c.github.io/webauthn/ moves ahead of the Recommendation; `uiMode` is specified through the Credential Management side and Chrome's docs below, and is not yet in the published Recommendation text.

**MDN overview**
https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API

Plain-language explanation of the create and get ceremonies with browser compatibility tables. Good first read for anyone new to WebAuthn.

---

## 2. AAGUID: naming the authenticator

**What it is.** The AAGUID (Authenticator Attestation GUID) is a 16-byte identifier for the authenticator model, sent inside the authenticator data on every registration. It is the same value for every passkey created by that model: all iCloud Keychain passkeys share one AAGUID, all Google Password Manager passkeys share another, each YubiKey model has its own. It is not new (it has been in WebAuthn since Level 1), but it became useful for passkeys once providers started reporting real values instead of zeros. It arrives with `attestation: "none"`, so we get it without asking for attestation.

**Why it matters for us.** It is the only automatic source of a readable name for the "Your passkeys" list (use case 1). `mock-server/label.ts` maps it to names such as "iCloud Keychain" or "1Password". All-zero means the provider chose not to disclose, which the demo shows as "Not disclosed".

**Community AAGUID list (what we vendored)**
https://github.com/passkeydeveloper/passkey-authenticator-aaguids

Maintained by passkey providers through pull requests. Provides `aaguid.json` (name only) and `combined_aaguid.json` (name plus light and dark SVG icons). The repo is explicit that it is a UX aid and not a security source. Our `aaguids.json` is a snapshot of this file; refresh it occasionally.

**FIDO Metadata Service (the official registry)**
https://fidoalliance.org/metadata/

A signed metadata BLOB listing every FIDO certified authenticator with its AAGUID, attestation root certificates and certification status. Needed only if the BED ever verifies `direct` attestation or wants to allow certified hardware only. For consumer sign-in with `attestation: "none"` the community list is enough.

**Registration options reference (ours)**
`docs/PASSKEY-REGISTRATION-OPTIONS.md`, section 3, explains why AAGUID is available without attestation.

---

## 3. Conditional UI (passkey autofill)

**What it is.** `navigator.credentials.get({ mediation: "conditional", publicKey })` is called while the sign-in form is idle. Nothing appears until the user focuses an input marked `autocomplete="username webauthn"`; the browser then lists the user's passkeys for this RP ID in the autofill bar next to saved passwords. If the user has no passkey, nothing is shown and the form behaves normally. This is the "it just offers my passkey when I tap the email box" experience on iPhone and it is the most widely supported of the three prompting layers.

**Rules the team must know.**
- Only one WebAuthn request may be pending per tab. Cancel the conditional request (`AbortController`, or SimpleWebAuthn's `WebAuthnAbortService.cancelCeremony()`) before starting any other ceremony. This is the cause of the "A request is already pending" error we hit on the docs page, where several previews share a tab.
- `allowCredentials` must be empty, because the browser is discovering credentials on its own.
- Detect with `getClientCapabilities().conditionalGet` (or the older `isConditionalMediationAvailable()`).

**web.dev: Sign in with a passkey through form autofill**
https://web.dev/articles/passkey-form-autofill

Google's walkthrough with the `autocomplete` attribute, the `mediation` value, feature detection and the abort pattern. Lists conditional UI support as Chrome 133+, Edge 133+, Firefox 135+ and Safari 17.4+ for the current API shape (earlier versions of Chrome and Safari supported it under `isConditionalMediationAvailable()`).

**SimpleWebAuthn browser package**
https://simplewebauthn.dev/docs/packages/browser

Documents `startAuthentication({ optionsJSON, useBrowserAutofill: true })`, the requirement that an input with `autocomplete="webauthn"` exists, `WebAuthnAbortService`, and `sendSignal()`. This is the library the client uses, version 14.

**passkeys.dev device support matrix**
https://passkeys.dev/device-support/

The per-platform table for synced passkeys, autofill UI and cross-device sign-in, with browser version numbers for Android, iOS and iPadOS, macOS, Windows, Chrome OS and Ubuntu. Use this when the client asks "will it work on X".

---

## 4. Immediate UI mode (immediate mediation)

**What it is.** The direct answer to "if the user has a passkey, show it straight away, otherwise do nothing". `navigator.credentials.get({ publicKey, uiMode: "immediate" })` opens the credential sheet at once if the browser's own provider holds a passkey (or, with `password: true`, a saved password) for this RP ID, and rejects with `NotAllowedError` right away and without any UI if not. The rejection is the fallback path to our OTP form.

**Important details, in order of how likely they are to bite us.**
1. Chrome 149 is the only browser that supports it as of September 2026. Safari 26.0 through 26.6 release notes do not mention it. Always feature detect with `getClientCapabilities().immediateGet` and fall back to conditional UI.
2. It must follow a user gesture such as a tap or click, and it does not consume that activation. Calling it on page load fails. This is why the demo waits for a click before running the layers.
3. The origin trial in Chrome 139 to 141 used `mediation: "immediate"`. Chrome 149 renamed it to `uiMode: "immediate"` and the old spelling no longer triggers the feature. Our `nudge.ts` uses the new spelling.
4. `allowCredentials` must be empty; a non-empty list throws `NotAllowedError`.
5. Incognito and private windows always throw `NotAllowedError`, so it cannot be used to detect passkeys there.
6. It only knows about passkeys in the browser's own provider (Google Password Manager, iCloud Keychain, Windows Hello). A passkey on the user's phone still needs the QR path.

**Chrome for Developers: Immediate UI mode for logins (reference doc)**
https://developer.chrome.com/docs/identity/immediate-ui-mode

The reference page with the call shape, the `immediateGet` feature check, the user gesture rule, the privacy safeguards and the list of eligible credentials. Quote this one to the client.

**Chrome for Developers: Streamlined sign-in, immediate UI mode is now available (May 2026)**
https://developer.chrome.com/blog/webauthn-immediate-ui

The launch post for Chrome 149. States plainly that `mediation: "immediate"` no longer triggers the feature.

**Chrome for Developers: origin trial announcement (August 2025)**
https://developer.chrome.com/blog/webauthn-immediate-mediation-ot

Historical. Useful only to understand older articles and libraries that still say `mediation: "immediate"`.

---

## 5. `getClientCapabilities()`: one call for feature detection

**What it is.** `PublicKeyCredential.getClientCapabilities()` returns a map of booleans: `conditionalGet`, `conditionalCreate`, `hybridTransport`, `passkeyPlatformAuthenticator`, `userVerifyingPlatformAuthenticator`, `relatedOrigins`, `signalAllAcceptedCredentials`, `signalCurrentUserDetails`, `signalUnknownCredential`, `immediateGet`, plus `extension:<name>` entries. It replaces the older one-off checks (`isConditionalMediationAvailable()`, `isUserVerifyingPlatformAuthenticatorAvailable()`), which our `nudge.ts` still uses as fallbacks. The demo's capabilities card is this map rendered.

**web.dev: Simpler WebAuthn feature detection**
https://web.dev/articles/webauthn-client-capabilities

Explains the call and lists support as Chrome 133, Edge 133, Firefox 135 and Safari 17.4.

**Chrome for Developers: Simplifying WebAuthn feature detection for passkeys (January 2025)**
https://developer.chrome.com/blog/passkeys-client-capabilities

The Chrome 133 launch post with examples of choosing UI based on the flags.

**MDN: `PublicKeyCredential.getClientCapabilities()`**
https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/getClientCapabilities_static

Full key list and compatibility table. Marked Baseline 2025.

---

## 6. Signal API: keeping the password manager in sync

**What it is.** Three static methods on `PublicKeyCredential` that let the site tell the credential provider about server-side changes, so the provider can hide or update passkeys it holds:

- `signalAllAcceptedCredentials({ rpId, userId, allAcceptedCredentialIds })`: "these are the only IDs still valid for this user"; anything else is hidden. Our `revokePasskey` and `resetPasskeyDemo` call this so a revoked passkey disappears from the user's keychain instead of failing at the next sign-in.
- `signalUnknownCredential({ rpId, credentialId })`: "the user just tried a passkey I do not know"; the provider hides that one.
- `signalCurrentUserDetails({ rpId, userId, name, displayName })`: update the name shown next to the passkey after a profile change.

All three are best effort and privacy safe: the provider never tells the site what it holds. Feature detect through `getClientCapabilities()`; SimpleWebAuthn wraps them in `sendSignal()`.

**Chrome for Developers: WebAuthn Signal API**
https://developer.chrome.com/docs/identity/webauthn-signal-api

Reference doc. Chrome 132 on desktop and Android, Edge the same, Safari 26; Firefox not yet.

**MDN: `signalAllAcceptedCredentials()`**
https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/signalAllAcceptedCredentials_static

Parameter shapes and encoding rules (base64url).

**WebKit: Safari 26.0 features**
https://webkit.org/blog/17333/webkit-features-in-safari-26-0/

Confirms the Signal API shipped in Safari 26.0. This is the page to cite for iPhone support.

---

## 7. `hints`, JSON options and Related Origin Requests

**Chrome for Developers: Introducing hints, Related Origin Requests and JSON serialization (Chrome 128 and 129)**
https://developer.chrome.com/blog/passkeys-updates-chrome-129

One post covering three things we use or may use:

- `hints`: an ordered list of `client-device`, `security-key`, `hybrid` that tells the browser which authenticator type to lead with, without excluding the others as `authenticatorAttachment` does. Our default policy sends `["client-device"]`.
- JSON serialization: `PublicKeyCredential.parseCreationOptionsFromJSON()`, `parseRequestOptionsFromJSON()` and `credential.toJSON()` remove the manual base64url handling. Available in Chrome 129, Firefox 119, Safari 18.4, Edge 129. `nudge.ts` uses `parseRequestOptionsFromJSON` for the immediate call; SimpleWebAuthn uses the same JSON shapes, which is why the contract types are `PublicKeyCredential*OptionsJSON`.
- Related Origin Requests: a `/.well-known/webauthn` file on the RP ID domain listing other origins allowed to use the same passkeys. Relevant if dealer sites on other domains should share the Toyota passkey.

**passkeys.dev: Client hints**
https://passkeys.dev/docs/advanced/client-hints/

Short explainer of hints with pointers to the support matrix.

---

## 8. Conditional create (not used yet, worth knowing)

**Chrome for Developers: Help users adopt passkeys more seamlessly**
https://developer.chrome.com/docs/identity/webauthn-conditional-create

`navigator.credentials.create({ publicKey, mediation: "conditional" })` creates a passkey silently right after a user signs in with a password the browser autofilled, with no prompt. Chrome 136 and later. Our flow is OTP rather than password, so it does not apply directly, but it is the pattern to look at when we decide how to offer passkey creation after an OTP sign-in.

---

## 9. Tooling for demos

**Chrome DevTools: WebAuthn panel (virtual authenticator)**
https://developer.chrome.com/docs/devtools/webauthn

Lets you add a virtual authenticator (`ctap2`, `internal`, resident keys on, user verification on) and run the whole flow on a laptop without a phone or biometric. Immediate UI mode and conditional UI both work against it in Chrome 149.

**passkeys.dev reference index**
https://passkeys.dev/docs/reference/

Platform-specific notes for Android, iOS and iPadOS, macOS, Windows and Chrome OS, plus known issues and a glossary. Send this to anyone who asks what "RP ID", "discoverable credential" or "hybrid transport" means.

---

## Suggested talking points for the team

1. WebAuthn L3 is a finished standard as of August 2026; the features above are in it, not experiments.
2. Naming passkeys is a server concern: AAGUID plus the community list, with user agent context and an optional nickname. No API lists what is on the device.
3. Prompting works in layers. Conditional UI is the baseline and works on iPhone today. Immediate UI mode is Chrome 149 only and needs a click. The relying party hint cookie covers everything else.
4. Every new call is feature detected through `getClientCapabilities()`; nothing in the code assumes support.
5. The Signal API is what makes revoke feel right to the user; it is cheap and safe to call, and Safari 26 now has it.
