# Passkey UI Controls – What the Client Can and Can't Change

Oct 29, 2026 · @Someone

## Summary

The passkey create and sign-in screens are drawn by the browser or operating system, not by our page, so no client function can change their layout, copy or branding. What we control is the **options object** passed to `navigator.credentials.create()` / `get()`, which SimpleWebAuthn passes through unchanged, plus a handful of call-level settings (`mediation`, abort signal) that decide *whether and how* a screen appears.

Answers to the three questions:

1. **Can a client function control what the create screen shows?** Only indirectly. The screen shows `user.name` (always) and `user.displayName` (some browsers), plus the site's domain from `rp.id`. `hints`, `authenticatorAttachment` and `excludeCredentials` change which choices the screen offers. SimpleWebAuthn's `startRegistration({ optionsJSON, useAutoRegister })` adds only one switch, `useAutoRegister`, which asks for silent creation with no screen at all. Text, colours and logos cannot be set.
2. **How does sign-in show only passkeys for our domain?** This is automatic and enforced by the browser and authenticator: every passkey is stored under the `rpId` it was created for, and `get()` only ever offers passkeys whose `rpId` matches the request. Passkeys for other sites are never listed. To narrow further, to one account's passkeys, the server sends `allowCredentials`; with an empty list the browser shows every account on that device that has a passkey for our `rpId`.
3. **What parameters control the screens?** A server-built set (`rp`, `user`, `excludeCredentials`, `allowCredentials`, `authenticatorSelection`, `hints`, `timeout`, `extensions`) and a client-only set (`mediation` / `useBrowserAutofill` / `useAutoRegister`, `uiMode: 'immediate'`, abort signal). Both are listed in full below.

So the architect's instinct and yours are both partly right: most of what changes the screen does come from the server's challenge options, but the client decides *which kind* of screen is used (modal, autofill, silent, or immediate) and can override some options before the call. In our setup, every server-built option comes from EDI / Auth0, so changes there are requests to that team, not frontend work.

**Start here for the walkthrough:** the section "The passkey flow, from challenge to sign-in", shows both flows step by step, what the user sees at each step, every attribute in plain words, and a demo site for each behaviour.

## Who controls the passkey screens

&#91;embedded content: who controls the passkey screens · 4 layers\]

The content of each screen is fixed by the server's options before our page sees them; our page only chooses how the browser presents them, and the browser or OS draws the dialog itself.

## The passkey flow, from challenge to sign-in

Registration and sign-in each run in five steps, and the user sees only two of them: the passkey sheet or list (step 3) and the device unlock (step 4). Every attribute either shapes those two screens or is checked silently by the browser or the server.

&#91;embedded content: passkey flow · registration and sign-in, 5 steps each\]

Read each column top to bottom. The attribute names in each box are the ones that matter at that step; the table below shows what the user sees at each step with a demo, and the Create screen and Sign-in screen sections after it go into each screen in detail.

### What the user sees at each step, and how to see it

| Step | What the user sees | Attributes that change it, in plain words | See it in a demo |
| --- | --- | --- | --- |
| **Reg 1** Server builds the options | Nothing | All the registration options are decided here, by EDI / Auth0 in our setup. A fresh random `challenge` and an `auth_session` handle are made for this one attempt. | [webauthn.io](https://webauthn.io/) advanced settings are this step: each switch changes one option |
| **Reg 2** Browser checks | Usually nothing. If this device already holds one of the shopper's passkeys, a "you already have a passkey" message | `rp.id` must be our domain or a parent of it, or the browser refuses with an error. `excludeCredentials` lists passkeys the shopper already has, to stop a duplicate. | On webauthn.io, register twice with the same username on the same device |
| **Reg 3** Create-passkey sheet | The browser or phone's own sheet: "Create a passkey for *domain*?" with the account name | `user.name` (and sometimes `user.displayName`) is the account label shown. `authenticatorAttachment` and `hints` decide whether it offers this device, a phone via QR code, or a security key first. | On webauthn.io, change **Attachment** to Cross-Platform, or a **Registration Hint** to Hybrid, and register again: the sheet switches to a QR code |
| **Reg 4** Device unlock | Face ID, fingerprint, device PIN, or a security-key touch | `userVerification`: **Required** always asks for face, finger or PIN; **Discouraged** may accept just a tap. `residentKey: required` saves it as a passkey that later appears in pickers. `pubKeyCredParams` picks the key type (invisible). | On webauthn.io, register with a security key and **User Verification** set to Discouraged, then Required: the PIN prompt appears only with Required |
| **Reg 5** Server verifies | Nothing, then our "passkey created" message | The server checks the signed answer: same `challenge`, our origin, our `rp.id`, and the "user verified" flag. It saves the public key and the credential ID. Registration doesn't sign the user in further (stays T1). | Chrome DevTools → [WebAuthn panel](https://developer.chrome.com/docs/devtools/webauthn) shows the saved credential and its RP ID |
| **Sign-in 1** Server builds the options | Nothing | A new `challenge`; `rpId`; `allowCredentials` (empty = any of this person's passkeys for our site); `userVerification`; `hints`; `timeout`. | webauthn.io **Authentication Settings** |
| **Sign-in 2** Our page picks the style | Either nothing yet (autofill waits in the email field) or the pop-up opens straight away | `mediation`: the default opens a pop-up; `conditional` (SimpleWebAuthn `useBrowserAutofill`) puts passkeys in the email field's dropdown; `uiMode: 'immediate'` shows the pop-up only when a passkey exists. | [Conditional UI demo](https://nsatragno.github.io/passkey-demos/conditional-ui) vs [with a button](https://nsatragno.github.io/passkey-demos/conditional-ui-with-button) |
| **Sign-in 3** Passkey list | A list of accounts by `user.name`, or the dropdown under the email field | Only passkeys saved for our `rpId` can appear: a passkey from another site never does. `allowCredentials` narrows it to named passkeys; empty shows every account with a passkey for our site on this device. `hints` can steer to phone QR or security key. | Make a passkey on webauthn.io, then open the [Chrome autofill demo](https://identity.chrome.dev/passkey-form-autofill): the webauthn.io passkey isn't offered |
| **Sign-in 4** Device unlock | Face ID, fingerprint or PIN | `userVerification` again decides whether face, finger or PIN is demanded. The device signs the challenge with the private key, which never leaves it. | On webauthn.io, sign in with **User Verification** Required |
| **Sign-in 5** Server verifies | Nothing, then the signed-in page | The server checks the signature with the saved public key, plus the challenge, origin, `rpId` and "user verified" flag; it uses `userHandle` to find the account. On success the session becomes T2. | [Signal API demo](https://nsatragno.github.io/passkey-demos/signal-api) shows how a passkey deleted on the server is then removed from the password manager |

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

## Every attribute, in plain words

The full list, in the order the flow uses them. "Visible?" says whether the user can see any effect.

**Registration options (server → browser)**

| Attribute | In plain words | Visible? | Our value | EDI today |
| --- | --- | --- | --- | --- |
| `challenge` | A one-time random number the device must sign, so an old answer can't be replayed | No | 32 random bytes, single use | 32 bytes — OK |
| `timeout` | How long the browser keeps the sheet open before giving up | Only if it runs out | 300,000 ms (5 min) | 60,000 ms — gap (R4) |
| `rp.id` | The website the passkey belongs to; it can only be used on that domain | Yes, as the site shown | Our app's parent domain, per environment | POC host — gap (R1) |
| `rp.name` | A friendly name for the website; deprecated in Level 3, may not be shown | Maybe | Brand name | Hostname — Should (R6) |
| `user.id` | A hidden, random account number stored in the passkey; comes back at sign-in as `userHandle` | No | Random, stable, no personal data | 64 random bytes — OK |
| `user.name` | The account label in the sheet and the password manager | Yes | Masked email or phone | Raw phone — gap (R5) |
| `user.displayName` | A friendlier label some browsers also show | Sometimes | First name, else masked contact | Raw phone — gap (R5) |
| `pubKeyCredParams` | Which key types we accept, best first | No (fails if none fit) | Ed25519, ES256, RS256 | Same — OK |
| `excludeCredentials` | Passkeys the shopper already has, so the same device can't make a second | Only as "already registered" | All their active passkeys | Not sent — gap (R3) |
| `authenticatorSelection.authenticatorAttachment` | Where the passkey may live: this device, a separate one, or either | Yes, which options the sheet offers | Not sent (either) | Not sent — OK |
| `authenticatorSelection.residentKey` | Save it as a true passkey that pickers and autofill can list | Indirectly, at sign-in | `required` | `required` — OK |
| `authenticatorSelection.requireResidentKey` | The old (Level 1) way of saying the same thing, for older browsers | No | `true` | Not sent — Should (R11) |
| `authenticatorSelection.userVerification` | Whether Face ID, fingerprint or PIN is demanded | Yes | `required` | `preferred` — gap (R2) |
| `attestation` | Whether the device must prove its make and model | Rarely | `none` | Not sent (= none) — OK |
| `hints` | Which route to suggest first: this device, phone QR, or security key | Yes, if honoured | `[]` | Not sent — OK |
| `extensions.credProps` | Ask the browser to report whether a true passkey was saved | No | `true` | Not sent — Should (R11) |

**Sign-in options (server → browser)**

| Attribute | In plain words | Visible? | Our value | EDI today |
| --- | --- | --- | --- | --- |
| `challenge` | New one-time number for this sign-in | No | 32 random bytes, single use | Not seen yet |
| `rpId` | Only passkeys for this website are offered | Yes, which passkeys appear | Same as registration | Not seen yet |
| `allowCredentials` | Limit the list to named passkeys; empty means "any for this site" | Yes, length of the list | Empty (needed for autofill) | Not seen yet |
| `userVerification` | Demand Face ID, fingerprint or PIN | Yes | `required` | Not seen yet (R2) |
| `hints` | Suggest this device, phone QR or security key | Yes, if honoured | `[]` | Not seen yet |
| `timeout` | How long the list stays open | Only if it runs out | 300,000 ms | Not seen yet |

**Call settings (our page → browser, not from the server)**

| Setting | In plain words | Visible? |
| --- | --- | --- |
| `mediation` (default) | Open the passkey pop-up now | Yes, a pop-up |
| `mediation: 'conditional'` on sign-in | Wait quietly and offer passkeys in the email field's dropdown (`useBrowserAutofill`) | Yes, in the dropdown |
| `mediation: 'conditional'` on create | Ask the password manager to add a passkey silently after a password sign-in (`useAutoRegister`); not usable with our OTP | At most a "saved" notice |
| `uiMode: 'immediate'` | Show the pop-up only if a passkey exists, otherwise fail quietly so we can show OTP | Yes, or nothing |
| `signal` | Lets our code close the pop-up | Pop-up closes |

**What comes back (browser → our page → server).** None of these are visible to the user; they are what the server checks in step 5.

| Attribute | Comes back on | In plain words | What the server does with it |
| --- | --- | --- | --- |
| `id` / `rawId` | Both | The passkey's ID (credential ID) | Saves it on registration; looks up the public key on sign-in |
| `response.clientDataJSON` | Both | What the browser saw: the `challenge`, the page's `origin`, and the ceremony type | Checks the challenge is the one it issued, the origin is ours, and the type is right |
| `response.attestationObject` | Registration | The new public key plus the device's details, wrapped together | Unpacks the public key and saves it |
| `response.authenticatorData` | Both | A small record from the device: which site (`rpId` hash), flags, and a counter | Checks the site hash and the flags below |
|  flag **UP** (user present) | Both | Someone touched or confirmed on the device | Required |
|  flag **UV** (user verified) | Both | Face ID, fingerprint or PIN was actually checked | Required when `userVerification` is `required` (R2) |
|  flags **BE** / **BS** (backup eligible / backed up) | Both | Whether the passkey can sync, and whether it has synced (iCloud, Google, password manager) | Label "synced" vs "this device only" (R8) |
|  sign count | Both | A counter some security keys increase each use; synced passkeys usually send 0 | Optional clone check |
|  AAGUID | Registration | Which kind of authenticator or password manager made it | Label such as "iCloud Keychain" (self-reported) |
| `response.publicKey`, `publicKeyAlgorithm`, `authenticatorData` (top level) | Registration | Level 3 shortcuts to values already inside `attestationObject` | Ignored; EDI must accept them (R7) |
| `response.transports` | Registration | How the device can be reached later: `internal`, `hybrid`, `usb`, `nfc`, `ble` | Saved, then sent back in `excludeCredentials` / `allowCredentials` |
| `response.signature` | Sign-in | The device's signature over the challenge and its data | Checked with the saved public key: the actual proof |
| `response.userHandle` | Sign-in | The hidden `user.id` stored in the passkey | Finds the account without the user typing anything |
| `authenticatorAttachment` | Both | Whether this device (`platform`) or a separate one (`cross-platform`) was used | Optional label |
| `clientExtensionResults` | Both | Answers to requested extensions, e.g. `credProps.rk` = a true passkey was saved | Confirms discoverability (R11) |

**EDI / Auth0 wrapper fields (not WebAuthn)**

| Field | In plain words |
| --- | --- |
| `authn_params_public_key` | EDI's name for the options object (registration or sign-in) |
| `auth_session` | A handle tying the options to the later complete call; should be single use and expire with `timeout` (R4) |
| `authentication_method_id` | EDI / Auth0's ID for a saved passkey; used to list and delete it (R8, R9); `null` on register start |
| `authn_response` | EDI's name for the browser's answer on the complete calls |

## Option values, defaults and Level 3 status

Each setting below lists every allowed value, what happens if the server leaves it out (the default), and which version of the WebAuthn standard added it. Level 3 is the current W3C version; Level 1 (2019) and Level 2 (2021) values are all still part of it. Values and defaults are from [MDN](https://developer.mozilla.org/docs/Web/API/PublicKeyCredentialCreationOptions), which follows the [W3C Level 3](https://www.w3.org/TR/webauthn-3/) text.

**Two kinds of control.** A *requirement* makes the browser refuse an authenticator that can't comply, so the user sees an error or that option is missing. A *preference* or *hint* only steers what's offered first, and the browser may ignore it. Knowing which one a setting is tells you whether it can break the flow.

### User Verification — `userVerification`

Used in both registration (`authenticatorSelection.userVerification`) and sign-in. Added in Level 1. **Default: `preferred`.**

| Value | In plain words | Kind | What the user notices |
| --- | --- | --- | --- |
| `required` (ours) | Face ID, fingerprint or PIN must be checked | Requirement | Always asked to unlock; a device that can't verify is refused with an error |
| `preferred` (default; EDI today) | Check if the device can; otherwise a tap is fine | Preference | Usually asked to unlock; a basic security key may only need a touch |
| `discouraged` | Avoid the check to keep it quick | Preference | May only need a touch; some devices still ask anyway |

### Attachment — `authenticatorSelection.authenticatorAttachment`

Registration only. Added in Level 1. **Default: not set, so any authenticator is allowed** (webauthn.io calls this "All Supported").

| Value | In plain words | Kind | What the user notices |
| --- | --- | --- | --- |
| Not set (ours; EDI today) | This device, a phone, or a security key | — | The sheet offers this device first, with "use a phone or security key" as another choice |
| `platform` | Only the authenticator built into this device (Touch ID, Face ID, Windows Hello, Android unlock) | Requirement | No QR code or security-key option; fails on a device without a built-in authenticator |
| `cross-platform` | Only a separate device: a phone via QR code, or a USB / NFC / Bluetooth security key | Requirement | Goes straight to the QR code or "insert your security key" |

### Discoverable credential — `authenticatorSelection.residentKey`

Registration only. Added in Level 2 to replace `requireResidentKey`. **Default: `required` if `requireResidentKey` is `true`, otherwise `discouraged`.**

| Value | In plain words | Kind | What the user notices |
| --- | --- | --- | --- |
| `required` (ours; EDI today) | Save a true passkey that remembers the account, so sign-in needs no username | Requirement | Later appears in the passkey picker and email autofill; an authenticator that can't store one is refused |
| `preferred` | Save a true passkey if the device can; the browser may ask the user to set up a PIN to make it possible | Preference | Usually a passkey; occasionally an older security key creates a non-discoverable credential instead |
| `discouraged` (default if neither field is sent) | A credential that does not remember the account | Preference | The user must type their email or phone before signing in, and it never appears in autofill |

**`requireResidentKey`** is the Level 1 version of the same setting. It is `true` or `false`, **defaults to `false`**, and is kept only for older browsers. The standard says set it to `true` exactly when `residentKey` is `required`, which EDI doesn't do yet (R11).

### Attestation — `attestation`

Registration only. **Default: `none`.** Level 1 had `none`, `indirect` and `direct`; Level 2 added `enterprise`.

| Value | In plain words | What the server gets |
| --- | --- | --- |
| `none` (default; ours; EDI today) | Don't prove the device's make and model | The public key only; if the device sends a certificate anyway, the browser removes it |
| `indirect` | Proof is wanted, but the browser may anonymise it | A certificate the browser may have replaced to protect privacy |
| `direct` | Send the device maker's proof as-is | The maker's signed certificate; synced passkeys usually still send none |
| `enterprise` | Send proof that can identify the exact device | Only for company-managed devices allowed by browser or enterprise policy |

**`attestationFormats`** (added in Level 3) lists the proof formats the server prefers, best first. It is a hint and **defaults to an empty list**. It only matters when `attestation` isn't `none`, so we don't need it.

### Hints — `hints`

Registration and sign-in. **Added in Level 3. Default: not sent, so the browser uses its own normal screen** (webauthn.io shows this as `Order: []`). The values are listed best first, and browsers that support hints use the first one they understand.

| Value | In plain words | What the browser suggests first | Closest older setting |
| --- | --- | --- | --- |
| `client-device` | Use this device's own unlock | This device's Face ID, fingerprint or Windows Hello | `authenticatorAttachment: platform` |
| `hybrid` | Use a phone | The QR code to scan with a phone | `cross-platform` (phone) |
| `security-key` | Use a physical security key | "Insert or tap your security key" | `cross-platform` (key) |

**How hints differ from attachment.** `authenticatorAttachment` is a requirement: it removes the other choices. `hints` is a suggestion: it changes which choice comes first, and the browser may ignore it, for example on Windows where Windows Hello draws the dialog ([Chrome](https://developer.chrome.com/blog/passkeys-updates-chrome-129)). On sign-in, hints win over the `transports` saved in `allowCredentials` when the two disagree ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions)). Chrome still honours `authenticatorAttachment` alongside hints. Our choice is no hints by default, with the option of `['client-device']` right after OTP.

### Other Level 3 additions that affect the flow

| Addition | What it does | Covered in |
| --- | --- | --- |
| `hints`, `attestationFormats` | Above | This section |
| Response `authenticatorAttachment` | Tells the server whether this device or another was used | Glossary above |
| Response shortcuts (`publicKey`, `publicKeyAlgorithm`, `authenticatorData`) and `toJSON()` | Easier server parsing; EDI must accept them | R7 in the EDI doc |
| `getClientCapabilities()` | One call to ask what the browser supports | Sign-in section |
| Signal API | Keep password managers in step with the server | Sign-in section |
| Related Origin Requests | Use one passkey across several of our own domains | Sign-in section, R1 |

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

## The webauthn.io settings, explained

Each setting in webauthn.io's advanced settings is one of the server options described above. Our page doesn't choose any of them; the server (EDI / Auth0) puts them in the challenge, the browser reads them, the user sees the result, and the server checks the answer matches.

**How one setting flows, using user verification as the example:**

1. The server writes `userVerification: "required"` into the options.
2. The browser reads it and tells the phone or laptop to ask for Face ID, fingerprint or PIN.
3. The user sees that prompt; a device with no such unlock is refused.
4. The answer comes back with a "user was verified" flag, and the server rejects it if the flag is missing.

### Registration settings

| Setting (option name) | The question it asks | Choices, and what the user notices | Our choice | EDI today |
| --- | --- | --- | --- | --- |
| User Verification (`authenticatorSelection.userVerification`) | Must the user prove it's them with Face ID, fingerprint or PIN, or is a tap enough? | **Required:** always asks; devices that can't verify are refused. **Preferred:** asks if the device can, otherwise a tap is accepted. **Discouraged:** tries to skip the check (a tap only). | Required | Preferred — gap (R2) |
| Attachment (`authenticatorSelection.authenticatorAttachment`) | Where may the passkey be stored? | **All supported** (not sent): this device, a phone via QR, or a security key. **Platform:** only this device's built-in unlock (Touch ID, Windows Hello, Android). **Cross-platform:** only a separate device, a phone via QR or a USB / NFC key. | All supported | Not sent — OK |
| Discoverable Credential (`authenticatorSelection.residentKey`) | Should the passkey remember the account, so the user never types a username? | **Required:** yes; this is what makes it a "passkey" that appears in the picker and autofill. **Preferred:** only if the device can. **Discouraged:** no; the user must enter their email or phone first and the server lists their keys. | Required | Required — OK (add `requireResidentKey`, R11) |
| Attestation (`attestation`) | Should the device prove its make and model? | **None:** no proof; we only receive the key, which is all sign-in needs. **Direct:** a signed certificate from the device maker. Synced passkeys (iCloud, Google) usually return none either way. | None | Not sent (= none) — OK |
| Supported Public Key Algorithms (`pubKeyCredParams`) | Which kinds of key will we accept, in order of preference? | **Ed25519** (`-8`), **ES256** (`-7`, the most common) and **RS256** (`-257`, used by Windows Hello) are today's standard set. **ML-DSA 44 / 65 / 87** (`-48`, `-49`, `-50`) are new quantum-resistant keys, still an [IETF draft](https://www.ietf.org/archive/id/draft-vitap-ml-dsa-webauthn-04.txt) with no mainstream authenticator support yet. The user notices nothing unless their device supports none of the list, which fails registration. | Ed25519, ES256, RS256; no ML-DSA until the draft settles and Auth0 can verify it | `-8`, `-7`, `-257` — OK |
| Registration Hints (`hints`) | Which way of creating should the browser suggest first? | **Security Key**, **Client Device** (this device's unlock) or **Hybrid** (phone via QR), most preferred first. **Order `[]`** means no hint: the browser shows its normal choice. A hint is a suggestion and may be ignored. | `[]` by default; optionally `['client-device']` right after OTP | Not sent — OK |

### Authentication settings

| Setting (option name) | The question it asks | Choices, and what the user notices | Our choice | EDI today |
| --- | --- | --- | --- | --- |
| User Verification (`userVerification`) | At sign-in, must the user unlock with Face ID, fingerprint or PIN? | Same three choices as registration. **Required** makes every passkey sign-in two factors in one step (the device plus the user's face, finger or PIN). | Required | Login options not seen yet — confirm (R2) |
| Authentication Hints (`hints`) | Which way of signing in should the browser suggest first? | Same three choices. **`[]`** lets the browser offer this device first and a phone via QR as the fallback. **Security Key** only suits staff with company-issued keys. | `[]` | Not seen yet |

Two things on webauthn.io's screen are **not** set by these options: the "Username" box (it becomes `user.name` and `user.displayName`, see the create-screen section) and anything about the domain (the passkey is always saved under webauthn.io's own `rpId`).

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
- [ML-DSA for WebAuthn (draft-vitap-ml-dsa-webauthn-04)](https://www.ietf.org/archive/id/draft-vitap-ml-dsa-webauthn-04.txt) — IETF Internet-Draft
- Demos: [webauthn.io](https://webauthn.io/) (Duo Labs), [Chrome passkey form autofill demo](https://identity.chrome.dev/passkey-form-autofill), [passkey demos: conditional UI, Signal API](https://nsatragno.github.io/passkey-demos), [Chrome DevTools WebAuthn panel](https://developer.chrome.com/docs/devtools/webauthn)
