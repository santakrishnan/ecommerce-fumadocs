# Passkey UI Controls – What the Client Can and Can't Change

Oct 28, 2026 · @Someone

## Summary

The passkey create and sign-in screens are drawn by the browser or operating system, not by our page, so no client function can change their layout, copy or branding. What we control is the **options object** passed to `navigator.credentials.create()` / `get()`, which SimpleWebAuthn passes through unchanged, plus a handful of call-level settings (`mediation`, abort signal) that decide *whether and how* a screen appears.

Answers to the three questions:

1. **Can a client function control what the create screen shows?** Only indirectly. The screen shows `user.name` (always) and `user.displayName` (some browsers), plus the site's domain from `rp.id`. `hints`, `authenticatorAttachment` and `excludeCredentials` change which choices the screen offers. SimpleWebAuthn's `startRegistration({ optionsJSON, useAutoRegister })` adds only one switch, `useAutoRegister`, which asks for silent creation with no screen at all. Text, colours and logos cannot be set.
2. **How does sign-in show only passkeys for our domain?** This is automatic and enforced by the browser and authenticator: every passkey is stored under the `rpId` it was created for, and `get()` only ever offers passkeys whose `rpId` matches the request. Passkeys for other sites are never listed. To narrow further, to one account's passkeys, the server sends `allowCredentials`; with an empty list the browser shows every account on that device that has a passkey for our `rpId`.
3. **What parameters control the screens?** A server-built set (`rp`, `user`, `excludeCredentials`, `allowCredentials`, `authenticatorSelection`, `hints`, `timeout`, `extensions`) and a client-only set (`mediation` / `useBrowserAutofill` / `useAutoRegister`, `uiMode: 'immediate'`, abort signal). Both are listed in full below.

So the architect's instinct and yours are both partly right: most of what changes the screen does come from the server's challenge options, but the client decides *which kind* of screen is used (modal, autofill, silent, or immediate) and can override some options before the call. In our setup, every server-built option comes from EDI / Auth0, so changes there are requests to that team, not frontend work.

## Who controls the passkey screens

&#91;embedded content: who controls the passkey screens · 4 layers\]

The content of each screen is fixed by the server's options before our page sees them; our page only chooses how the browser presents them, and the browser or OS draws the dialog itself.

## SimpleWebAuthn browser package

`@simplewebauthn/browser` is a thin wrapper: it decodes the server's JSON options, calls `navigator.credentials.create()` / `get()`, and encodes the result back to JSON. It adds **no UI of its own**. Every field in `optionsJSON` (including `hints`) is spread straight into the native call; the only extra controls are the three flags below. We have **13.3.0** installed; the current docs describe **14.0.0**, which adds the last three functions in the table.

**How to read this table.** "In plain words" says what the function is for; "What the user sees" describes the screen that results. Functions with no screen are checks we run *before* showing a passkey button.

| Function | In plain words | What the user sees | In 13.3.0 |
| --- | --- | --- | --- |
| `startRegistration({ optionsJSON })` | **Create a passkey.** Hands the server's options to the browser and returns the new passkey for the server to save. | The browser or phone's own "Create a passkey for *site*?" sheet, then Face ID, fingerprint or device PIN. | Yes |
| `startRegistration({ …, useAutoRegister: true })` | **Create a passkey without asking.** Asks the password manager to quietly add a passkey, but only straight after the user signed in with a password it saved. | Nothing, or a small "passkey saved" notice. If the conditions aren't met, nothing happens. | Yes |
| `startAuthentication({ optionsJSON })` | **Sign in with a passkey.** Opens the browser's passkey picker and returns the signed answer for the server to check. | A pop-up listing the accounts that have a passkey for our site, then Face ID, fingerprint or PIN. | Yes |
| `startAuthentication({ …, useBrowserAutofill: true })` | **Sign in from the email field.** Same as above, but without the pop-up. | Passkeys appear in the dropdown under the email / phone field, like saved passwords. Picking one asks for Face ID or fingerprint. | Yes |
| `verifyBrowserAutofillInput` (with the option above) | **Safety check** that the page has a field marked `autocomplete="username webauthn"`; turn it off only if the field is inside a web component. | Nothing | Yes |
| `browserSupportsWebAuthn()` | **"Can this browser do passkeys at all?"** | Nothing; we use it to hide the passkey button on old browsers | Yes |
| `platformAuthenticatorIsAvailable()` | **"Does this device have its own unlock?"** (Touch ID, Face ID, Windows Hello, Android fingerprint) | Nothing; we use it to decide whether to offer "Create a passkey on this device" | Yes |
| `browserSupportsWebAuthnAutofill()` | **"Can passkeys show in the email field's dropdown?"** | Nothing; decides whether we use the autofill mode or a button | Yes |
| `WebAuthnAbortService.cancelCeremony()` | **Close the passkey pop-up from code**, for example when the user switches to OTP or leaves the page. | The pop-up disappears | Yes |
| `WebAuthnError` | **Explains a failure as a code we can act on**, e.g. "already registered on this device", "user cancelled", "domain doesn't match". | Nothing by itself; we choose the message to show | Yes |
| `sendSignal()` | **Tell the password manager what changed**: a passkey was deleted, or the account name changed. | The deleted passkey disappears from the saved-passkeys list; the name updates | No (14.x) |
| `browserSupportsPasskeys()`, `getBrowserCapabilities()` | **A fuller "what can this browser do?" check** in one call (autofill, silent creation, phone QR, and so on). | Nothing | No (14.x) |

Two behaviours worth knowing: `startAuthentication()` drops an empty `allowCredentials` array before calling `get()` (an empty list and no list mean the same thing to the browser), and the error codes are guesses from the browser's generic `DOMException`, so `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY` means the library couldn't tell. Source: [SimpleWebAuthn browser docs](https://simplewebauthn.dev/docs/packages/browser) and the installed 13.3.0 source.

## Create screen: what each parameter changes

Three fields put words on the create screen (`rp.id`, `user.name`, `user.displayName`); the rest change which options the screen offers or whether it appears at all. All of them except the last two rows arrive in the server's options (from EDI / Auth0 in our setup).

| Parameter | Set by | Effect on the create screen |
| --- | --- | --- |
| `rp.id` | Server | The site domain the browser names in the prompt; also the scope the passkey is saved under |
| `rp.name` | Server | Deprecated in WebAuthn Level 3 and kept for compatibility; don't rely on it being displayed ([web.dev](https://web.dev/articles/passkey-registration)) |
| `user.name` | Server | Shown in the account selector and stored in the password manager ([web.dev](https://web.dev/articles/passkey-registration)) |
| `user.displayName` | Server | May be shown, depending on the browser ([web.dev](https://web.dev/articles/passkey-registration)) |
| `excludeCredentials` | Server | If this device already holds one of the listed passkeys, the browser stops with an "already registered" message (`InvalidStateError`) |
| `authenticatorSelection.authenticatorAttachment` | Server | `platform`: only this device's authenticator; `cross-platform`: phone (QR) or security key; unset: the browser offers both |
| `authenticatorSelection.residentKey` | Server | `required` makes it a discoverable passkey; authenticators that can't store one are refused |
| `authenticatorSelection.userVerification` | Server | Whether the screen asks for biometrics or a PIN; `required` fails on authenticators that can't verify the user |
| `hints` | Server (or client override) | Preferred UI: `client-device`, `hybrid` (QR / phone) or `security-key`, in preference order. A hint, not a rule: it may be ignored, for example on Windows where Chrome doesn't draw the dialog ([Chrome](https://developer.chrome.com/blog/passkeys-updates-chrome-129), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions)) |
| `timeout` | Server | How long the screen waits before failing; the browser may override it |
| `pubKeyCredParams`, `attestation`, `extensions` | Server | No visible change in normal use; an authenticator that supports none of the algorithms is refused |
| `mediation: 'conditional'` (SimpleWebAuthn `useAutoRegister`) | Client | No create screen: the password manager may create the passkey silently after a recent password sign-in and show a success notice only ([Chrome](https://developer.chrome.com/docs/identity/webauthn-conditional-create)) |
| `signal` (`WebAuthnAbortService`) | Client | Closes a pending screen |

**What cannot be controlled from any side:** the dialog's wording, layout, colours, logo or language; which password manager saves the passkey (the user's default); and whether the browser honours `hints`. The look differs by browser and operating system because each one draws its own dialog.

**Correction to our EDI requirements doc:** R6 asked for a brand-name `rp.name` because it shows in the prompt. Since `rp.name` is deprecated in Level 3 and may not be shown, that requirement should drop to a Should. The masked `user.name` / `user.displayName` requirement (R5) stays a Must, because those values are displayed and synced.

## Sign-in screen: which passkeys are listed

The browser and authenticator already show only passkeys for our domain; no code is needed and none can turn it off. Within our domain, the server's `allowCredentials` decides whether the list is every account on the device or only named passkeys.

**Layer 1 — domain (automatic).** A passkey is saved under the `rpId` it was created with. On `get()`, the browser checks that `rpId` is the page's domain or a parent of it, and the authenticator checks that each credential's `rpId` matches the request ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions), [W3C](https://www.w3.org/TR/webauthn-3/)). Passkeys for other sites are never offered. The only way to widen this is Related Origin Requests, where the RP ID's domain publishes a list of other origins allowed to use it.

**Layer 2 — account (server-chosen).**

| `allowCredentials` | What the user sees | When to use |
| --- | --- | --- |
| Empty or omitted | Every passkey this device or password manager holds for our `rpId`, listed by `user.name`, including other people's accounts on a shared device | Usernameless sign-in and autofill (autofill *requires* an empty list) |
| One or more credential IDs | Only those passkeys. If one is on this device, it goes straight to biometrics or PIN; otherwise the browser offers another device (QR) or a security key ([web.dev](https://web.dev/articles/webauthn-discoverable-credentials)) | After the user has typed an email or phone and the server has looked up their passkeys |

**Layer 3 — stale entries (Signal API).** A passkey deleted on the server still appears in the password manager until the site tells it otherwise. `signalAllAcceptedCredentials` hides passkeys not in the server's list, `signalUnknownCredential` reports one that failed, and `signalCurrentUserDetails` refreshes names. Supported in Chrome and Edge 132+; check Safari before relying on it; not in Firefox ([Chrome](https://developer.chrome.com/docs/identity/webauthn-signal-api)).

### Sign-in parameters

| Parameter | Set by | Effect on the sign-in screen |
| --- | --- | --- |
| `rpId` | Server | Which domain's passkeys are eligible (Layer 1); defaults to the page's domain |
| `allowCredentials` | Server | Account-level filter (Layer 2) |
| `userVerification` | Server | `required` always asks for biometrics or PIN, and fails without it; default `preferred` |
| `hints` | Server (or client override) | Preferred route: this device, phone (QR) or security key; may be ignored |
| `timeout` | Server | How long the screen waits |
| `challenge`, `extensions` | Server | No visible change |
| `mediation` (default `optional`) | Client | Modal account picker |
| `mediation: 'conditional'` (SimpleWebAuthn `useBrowserAutofill`) | Client | No modal; passkeys appear in the username field's autofill list, and the call waits until one is picked ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get)) |
| `uiMode: 'immediate'` | Client | Shows the picker only if a passkey is available; otherwise rejects silently so the page can fall back to OTP. New in Chrome (148–149); replaces the earlier `mediation: 'immediate'` trial; not in SimpleWebAuthn 13.3 ([Chrome](https://developer.chrome.com/blog/webauthn-immediate-ui)) |
| `signal` | Client | Cancels a pending request, e.g. before starting a different ceremony |

**Feature detection.** `PublicKeyCredential.getClientCapabilities()` reports `conditionalGet`, `conditionalCreate`, `hybridTransport`, `passkeyPlatformAuthenticator`, `userVerifyingPlatformAuthenticator`, `relatedOrigins` and the three `signal*` methods (Chrome and Edge 133, Firefox 135, Safari 17.4) ([web.dev](https://web.dev/articles/webauthn-client-capabilities)).

## Browser and platform differences

The same options produce different screens on each browser and OS, and the newer controls aren't everywhere yet, so every one of them needs feature detection and a fallback. On Windows the dialog comes from Windows Hello rather than the browser, which is why `hints` can be ignored there.

| Control | Chrome / Edge | Safari | Firefox | Source |
| --- | --- | --- | --- | --- |
| `getClientCapabilities()` | 133+ | 17.4+ | 135+ | [web.dev](https://web.dev/articles/webauthn-client-capabilities) |
| `hints` | 128–129+; may be ignored on Windows | Not stated | Not stated | [Chrome](https://developer.chrome.com/blog/passkeys-updates-chrome-129) |
| Autofill sign-in (`mediation: 'conditional'` on `get`) | Yes | Yes | Check `conditionalGet` | [web.dev](https://web.dev/articles/webauthn-client-capabilities) |
| Silent creation (`mediation: 'conditional'` on `create`) | Desktop and Android | macOS, and all iOS browsers; third-party password managers decide for themselves | Not stated | [Chrome](https://developer.chrome.com/docs/identity/webauthn-conditional-create) |
| `uiMode: 'immediate'` | New (148–149) | Not stated | Not stated | [Chrome](https://developer.chrome.com/blog/webauthn-immediate-ui) |
| Signal API | 132+ | Listed as 26, but the page also says "not yet implemented" — verify | No | [Chrome](https://developer.chrome.com/docs/identity/webauthn-signal-api) |
| Related Origin Requests | Yes (max 5 domain labels) | Yes | No | [web.dev](https://web.dev/articles/webauthn-related-origin-requests) |

"Not stated" means the cited source doesn't say; check [caniuse](https://caniuse.com/mdn-api_publickeycredential_getclientcapabilities_static) or MDN's compatibility tables before depending on it.

## Try it yourself

These public demo sites show each behaviour in a real browser. Use a test account only; none of them are ours.

| Demo | What to try | What it shows |
| --- | --- | --- |
| [webauthn.io](https://webauthn.io/) (Duo Labs) | Register and sign in with any username; open its advanced settings and change user verification, authenticator type, discoverable credential or hints, then repeat | How server options change the create and sign-in screens |
| [webauthn.io](https://webauthn.io/), then [Chrome autofill demo](https://identity.chrome.dev/passkey-form-autofill) | Create a passkey on webauthn.io, then sign in on the second site | Domain scoping: the webauthn.io passkey is never offered on the other site |
| [Chrome passkey form autofill demo](https://identity.chrome.dev/passkey-form-autofill) (Google) | Register, sign out, then click the email field | Autofill sign-in (`useBrowserAutofill`): passkeys in the field's dropdown, no pop-up |
| [Conditional UI demo](https://nsatragno.github.io/passkey-demos/conditional-ui) and [with a button](https://nsatragno.github.io/passkey-demos/conditional-ui-with-button) | Compare the autofill list with the button-triggered pop-up | The two sign-in styles side by side |
| [Signal API demo](https://nsatragno.github.io/passkey-demos/signal-api) | Create a passkey, then send each signal | A deleted or renamed passkey updating in the password manager (Chrome 132+) |
| [Chrome DevTools → WebAuthn panel](https://developer.chrome.com/docs/devtools/webauthn) | Add a virtual authenticator, then use any demo above | Test without a real device; see the stored passkeys and their RP ID |

For silent creation (`useAutoRegister`) and `uiMode: 'immediate'` we found no public demo; the [Conditional Create guide](https://developer.chrome.com/docs/identity/webauthn-conditional-create) and [Immediate UI post](https://developer.chrome.com/blog/webauthn-immediate-ui) have code to try on a test page.

## Recommendations

The client's lever is choosing the *kind* of screen per step and detecting what the browser supports; everything that changes the screen's content goes to EDI / Auth0 as a server-option request.

**In our web app (frontend):**

1. **Sign-in:** put `autocomplete="username webauthn"` on the email / phone field and start `startAuthentication({ optionsJSON, useBrowserAutofill: true })` on page load, so passkeys appear in autofill. Keep a "Sign in with a passkey" button that runs the modal picker, and OTP as the fallback.
2. **Registration:** use the normal modal `startRegistration({ optionsJSON })` after OTP. Don't use `useAutoRegister`: silent creation needs a recently used *saved password*, and our sign-in is OTP, so it won't trigger.
3. **Feature detection:** gate the passkey options on `getClientCapabilities()` (`passkeyPlatformAuthenticator`, `conditionalGet`), falling back to SimpleWebAuthn's checks on browsers without it.
4. **Errors:** map `WebAuthnError.code` to messages: `ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED` → "already set up on this device"; `ERROR_CEREMONY_ABORTED` and `NotAllowedError` → treat as a cancel, no error banner.
5. **`hints` is the one option the client can safely override** (e.g. `['client-device']` when prompting right after OTP), because it doesn't affect server verification. Never change `challenge`, `rpId`, `userVerification`, `allowCredentials` or `excludeCredentials` on the client: verification fails or policy is bypassed.
6. **Signal API:** after a delete and on each sign-in, send `signalAllAcceptedCredentials` so deleted passkeys stop appearing. That needs the credential IDs and `user.id` from EDI (R8) and either SimpleWebAuthn 14.x (`sendSignal`) or a direct call.
7. **Upgrade check:** evaluate moving `@simplewebauthn/browser` and `/server` from 13.3 to 14.x together for `sendSignal()` and `getBrowserCapabilities()`.

**From EDI / Auth0 (server options):**

| What we need | Why it changes the screen |
| --- | --- |
| Masked `user.name`, first-name `user.displayName` (R5) | These are the words on the create screen and in the password manager |
| `excludeCredentials` (R3) | Gives the "already registered on this device" stop |
| `userVerification: "required"` (R2) | Forces biometrics or PIN on both screens |
| Login options with an empty `allowCredentials` | Required for autofill sign-in and usernameless sign-in |
| `timeout: 300000` (R4) | Keeps the screen open long enough for phone / QR use |
| `rp.id` = our app's parent domain (R1) | Decides the domain shown and which passkeys are eligible at sign-in |
| `rp.name` = brand (R6, now Should) | Deprecated in Level 3; nice to have, not reliably shown |

## Sources

- [Web Authentication Level 3](https://www.w3.org/TR/webauthn-3/) — W3C specification
- [PublicKeyCredentialCreationOptions](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions) — MDN
- [PublicKeyCredentialRequestOptions](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions) — MDN, `rpId`, `allowCredentials`, `hints`, `userVerification`
- [CredentialsContainer.get()](https://developer.mozilla.org/en-US/docs/Web/API/CredentialsContainer/get) — MDN, `mediation` values
- [SimpleWebAuthn browser package](https://simplewebauthn.dev/docs/packages/browser) — SimpleWebAuthn docs
- [Create a passkey for passwordless logins](https://web.dev/articles/passkey-registration) — web.dev, which fields are displayed
- [Discoverable credentials deep dive](https://web.dev/articles/webauthn-discoverable-credentials) — web.dev, `allowCredentials` behaviour
- [Simpler WebAuthn feature detection with getClientCapabilities()](https://web.dev/articles/webauthn-client-capabilities) — web.dev
- [Allow passkey reuse across your sites with Related Origin Requests](https://web.dev/articles/webauthn-related-origin-requests) — web.dev
- [Introducing hints, Related Origin Requests and JSON serialization](https://developer.chrome.com/blog/passkeys-updates-chrome-129) — Chrome for Developers
- [Help users adopt passkeys more seamlessly (Conditional Create)](https://developer.chrome.com/docs/identity/webauthn-conditional-create) — Chrome for Developers
- [WebAuthn Immediate UI](https://developer.chrome.com/blog/webauthn-immediate-ui) — Chrome for Developers
- [Keep passkeys consistent with the Signal API](https://developer.chrome.com/docs/identity/webauthn-signal-api) — Chrome for Developers
