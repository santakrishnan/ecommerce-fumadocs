# Passkeys: approach options for two client use cases

**Audience:** client stakeholders and the BED (backend) team
**Scope:** the two questions raised in review: (1) listing a customer's passkeys with readable names, and (2) detecting a passkey on the device and prompting the user to sign in with it
**Context:** the frontend already has a working passkey flow (`@simplewebauthn/browser` client, WebAuthn JSON contract at `/api/auth/passkey/*`, mock relying party for development). Everything below builds on that contract. Nothing changes for the pages already built.

---

## Use case 1: list all passkeys for a customer, with readable names

### What is and is not possible

A website cannot read the list of passkeys stored on a device or in a password manager. Browsers block this on purpose, because a site that could list credentials could track users across the web. The browser reveals a credential only when the user selects one in the system prompt.

So "list the passkeys on this device" cannot be done by any SDK. "List the passkeys registered for this customer" can be done, using the relying party's own records. This is how Google, Apple, GitHub and banks show the "Your passkeys" page on an account.

### What the server receives when a passkey is created

Only technical data: a random credential ID, the public key, the AAGUID (a 16-byte identifier for the authenticator model), the transports (`internal`, `usb`, `nfc`, `ble`, `hybrid`), and two flags: whether the passkey is backed up (synced to a cloud keychain rather than bound to one device) and whether the user was verified. There is no name in this data. If the BED stores only what it receives, the list will show IDs.

### Options for producing a readable name

| Option | How it works | Benefits | Limits |
| --- | --- | --- | --- |
| A. Authenticator name from the AAGUID | Look up the AAGUID in the community list (`passkeydeveloper/passkey-authenticator-aaguids`) and, for hardware keys, the FIDO Metadata Service. Produces names such as "iCloud Keychain", "Google Password Manager", "1Password", "YubiKey 5 NFC", "Windows Hello". | Automatic. No user input. Also provides a vendor icon. | Some authenticators report an all-zero AAGUID (shown as "Not disclosed"). The list needs periodic refresh. |
| B. Context captured at registration | Store the user agent (for "Safari on iPhone" or "Chrome on Windows"), the transports, the backed-up flag and the timestamp. Build a default label such as "iCloud Keychain · iPhone · added 14 Sep 2026". | Works even when the AAGUID is undisclosed. Matches what users see on Google and GitHub. | User agent parsing is approximate. The label describes the device that registered the passkey; a synced passkey also exists on the user's other devices. |
| C. A nickname chosen by the user | `PATCH /passkeys/:id { nickname }` from the account page, for example "Work laptop". | Shows exactly what the user wants. | Optional. Most users never rename. |

**Recommendation:** use A and B together as the automatic default, with C as an override. Display rule: show the nickname if set; otherwise show `<authenticator name> · <platform> · added <date>`; if neither the AAGUID nor the user agent is usable, show `Passkey · added <date>`.

### Who does what

| Party | Work |
| --- | --- |
| BED | Store per credential: `aaguid`, `transports`, `backedUp`, `createdAt`, `lastUsedAt`, `authenticatorName` (from the AAGUID lookup), `platformLabel` (from the user agent) and `nickname`. Provide `GET /passkeys`, `PATCH /passkeys/:id` and `DELETE /passkeys/:id` for the signed-in customer. Update `lastUsedAt` and the backed-up flag on each successful sign-in. |
| Frontend proxy | If the BED prefers not to parse user agents, the Next.js route that forwards `register/verify` can compute `platformLabel` (it sees the request headers) and the AAGUID name, and pass both to the BED to store. The proxy holds no state; the BED remains the single source of truth. |
| Frontend UI | A "Your passkeys" list on the account page with name, type badge (Synced or Device-bound), last used, rename and revoke. Reuses the existing `StoredPasskeyCard`. |
| Cleanup after revoke | After `DELETE`, call the Signal API (`signalAllAcceptedCredentials`) so the user's password manager hides the revoked passkey. Best effort, with feature detection. The demo's Reset link already does this. |

### Contract additions

```ts
interface PasskeyCredentialSummary {
  // existing: id, publicKey, counter, transports, type, backedUp, aaguid, createdAt, lastUsedAt
  name: string;                     // display label, built by the rule above
  authenticatorName: string | null; // from the AAGUID lookup
  platformLabel: string | null;     // from the user agent at registration
  nickname: string | null;          // set by the user
}
// GET    /passkeys       -> PasskeyCredentialSummary[]
// PATCH  /passkeys/:id   { nickname } -> PasskeyCredentialSummary
// DELETE /passkeys/:id   -> { revokedId, remainingIds }  (frontend then signals the authenticator)
```

### How this will be shown

The mock relying party acts as both server and proxy today, so the demo page can show the finished result: a list that reads "iCloud Keychain · Safari on iPhone · added 16 Sep 2026", with rename and revoke. The contract tells the BED which fields to produce.

---

## Use case 2: detect a passkey on an iPhone or tablet and prompt the user to sign in

### What is and is not possible

The same privacy rule applies. The site cannot ask the browser whether a passkey exists. What it can do is invite the browser to use one in a way that stays silent when there is none. Three mechanisms exist. They differ in how automatic they are and how widely they are supported. The recommendation is to use them in layers.

### Option A: conditional UI (passkey autofill). The baseline; ship first.

Call `navigator.credentials.get()` with `mediation: "conditional"` when the sign-in view loads, and mark the email field with `autocomplete="username webauthn"`. When the user taps the field, the keyboard's autofill bar offers their passkey for this domain. If they have none, nothing appears and the field works normally. One tap completes sign-in, with no username and no button.

- SimpleWebAuthn: `startAuthentication({ optionsJSON, useBrowserAutofill: true })`.
- Support: iOS and iPadOS 16 and later, Android Chrome, desktop Chrome, Edge and Safari. The most mature of the three mechanisms.
- Fit with the OTP flow: the existing `OtpStart` email field becomes the autofill anchor. A passkey user never reaches the OTP step.

### Option B: immediate mediation. The direct "detect and prompt".

`navigator.credentials.get({ mediation: "immediate", ... })` asks the browser to show the passkey prompt right away if a passkey exists for this domain, and to reject immediately (`NotAllowedError`) with no UI if none exists. This is the behaviour the client described. The rejection path leads straight to the OTP form.

- This is recent (WebAuthn Level 3). It is shipping in Chromium first and other browsers are following. It must be feature detected with `PublicKeyCredential.getClientCapabilities()` and its `immediateGet` flag. Where it is absent, Option A is the fallback.
- If the SDK version has no flag for it, it is one direct `navigator.credentials.get()` call using the SDK's option parsers.
- Limit: it only knows about passkeys in this browser's password manager. A user whose passkey is on their phone still needs Option C or the QR path.

### Option C: relying party hint. Works everywhere today.

The server knows it registered a platform passkey from this browser (`authenticatorAttachment: "platform"` in the response) and that this browser last signed in with a passkey. Set a first-party cookie or flag. On return, show "Sign in with your passkey" as the primary action before anything else. This is an inference rather than a detection, but it is what most production sites do and it costs almost nothing.

### Always available: sign in from another device

With any of the above, a phone can act as the authenticator for a desktop through the hybrid transport (QR code). "No passkey on this device" is never a dead end.

### Recommended sequence on the sign-in step

1. On load, read `getClientCapabilities()`.
2. If `immediateGet` is available, try immediate mediation. Success means the user is signed in. An immediate rejection means continue.
3. Otherwise, or after a rejection, start conditional UI on the email field (Option A) so the autofill prompt appears if the user taps.
4. If the relying party hint says this browser has a passkey (Option C), show "Sign in with your passkey" as the primary button above the OTP form. Otherwise OTP is primary and passkey is secondary.
5. The fallback path is the OTP flow, unchanged.

### Who does what

| Party | Work |
| --- | --- |
| BED | Nothing new for Options A and B. The existing `login/options` endpoint already returns discoverable-credential options with an empty `allowCredentials`. For Option C, return `authenticatorAttachment` from `register/verify` and `login/verify` so the frontend can set the hint. |
| Frontend | Capability detection; the immediate mediation attempt with fallback; conditional UI on the `OtpStart` field; the hint cookie; and the `useAuth` and `AuthOverlay` sequencing so passkey is offered before OTP (`acr: 2`, `evidence: ["passkey"]` in the existing model). |
| Product | Copy for the prompt, and for the case where a passkey exists but the user cancels. |

### Browser support (feature detect, never assume)

| Mechanism | iPhone and iPad Safari | Android Chrome | Desktop Chrome and Edge | Desktop Safari | Detection |
| --- | --- | --- | --- | --- | --- |
| Conditional UI (A) | Yes | Yes | Yes | Yes | `getClientCapabilities().conditionalGet` or `isConditionalMediationAvailable()` |
| Immediate mediation (B) | Rolling out | Recent versions | Recent versions | Rolling out | `getClientCapabilities().immediateGet` |
| Relying party hint (C) | Yes | Yes | Yes | Yes | None needed |
| Another device via QR | Yes | Yes | Yes | Yes | `getClientCapabilities().hybridTransport` |

### How this will be shown

The demo page will get a capabilities readout (so the client can see what their own device supports), the immediate mediation attempt with a visible fallback, conditional UI on the email field, and the hint-driven prompt. On an iPhone with a registered passkey, the page opens straight into the passkey prompt. On a device without one, it falls through to the form with no flicker.

---

## Decisions requested from the client

1. Naming: approve the display rule (nickname, otherwise `<authenticator> · <platform> · added <date>`) and the three BED endpoints (`GET`, `PATCH`, `DELETE /passkeys`).
2. Prompting: approve the layered approach (immediate mediation, then conditional UI, then relying party hint, then OTP) and that passkey is offered before OTP when available.
3. Label ownership: confirm whether the BED will compute `authenticatorName` and `platformLabel` itself, or accept them from the Next.js proxy at registration. The second option keeps the BED thin and is recommended.

## Effort estimate (frontend, demo quality)

| Item | Estimate |
| --- | --- |
| Contract additions, mock endpoints, "Your passkeys" list with rename and revoke, Signal API | 1 to 1.5 days |
| Capability readout, immediate mediation, conditional UI, hint prompt on the demo page | 1 day |
| Integration into `AuthOverlay` and `GuardedLink` (passkey before OTP) | 1 day |
| Documentation updates and client walkthrough | 0.5 day |
