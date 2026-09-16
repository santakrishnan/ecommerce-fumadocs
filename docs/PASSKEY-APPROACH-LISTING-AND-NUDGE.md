# Passkeys — approach options for two client use cases

**Audience:** client stakeholders and the BED (backend) team.
**Scope:** the two questions raised in review — (1) listing a customer's passkeys with readable names, (2) auto-detecting a passkey on the device and nudging the user to sign in with it.
**Context:** the frontend already has a working passkey flow (`@simplewebauthn/browser` client, WebAuthn L3 JSON contract at `/api/auth/passkey/*`, dev-only mock relying party). Everything below builds on that contract; nothing changes for the customer-facing pages already built.

---

## Use case 1 — "List all passkeys mapped to this customer, with readable names"

### The constraint to state up front

A website **cannot enumerate the passkeys stored on a device or in a password manager**. Browsers withhold that on purpose — a site that could list credentials could fingerprint users across the web. The only moment a browser reveals a credential is when the user picks one in the system sheet.

So "list the passkeys on this device" is not achievable by any SDK. **"List the passkeys registered for this customer" is** — from the relying party's own records — and that is what every reference implementation (Google, Apple ID, GitHub, banks) shows on its account page.

### What WebAuthn gives the server at registration

Only opaque or technical data: a random credential ID, the public key, the **AAGUID** (authenticator model identifier, 16 bytes), the **transports** (`internal`, `usb`, `nfc`, `ble`, `hybrid`), and two flags — **backed up** (synced to a cloud keychain vs. bound to one device) and **user verified**. There is **no name**. If the BED stores only what the ceremony returns, the list is a list of IDs.

### Options for a readable name

| Option | How | Pros | Cons |
| --- | --- | --- | --- |
| **A. AAGUID → authenticator name** | Resolve the AAGUID against the community list (`passkeydeveloper/passkey-authenticator-aaguids`) and, for hardware keys, the FIDO Metadata Service. Yields "iCloud Keychain", "Google Password Manager", "1Password", "YubiKey 5 NFC", "Windows Hello". | Automatic; no user input; also gives the vendor icon. | Some authenticators report an all-zero AAGUID ("Not disclosed"); list must be refreshed periodically. |
| **B. Context captured at registration** | Store user agent (→ "Safari on iPhone", "Chrome on Windows"), transports, backed-up flag, timestamp. Derive a default label such as **"iCloud Keychain · iPhone · added 14 Sep 2026"**. | Works even when AAGUID is undisclosed; matches what users expect from Google/GitHub. | UA parsing is heuristic; the label describes the *registering* device, which for a synced passkey is not the only device it lives on. |
| **C. User-chosen nickname** | `PATCH /passkeys/:id { nickname }` from the account page ("Work laptop"). | Exactly what the user wants to see. | Optional effort by the user; most never rename. |

**Recommendation: A + B as the automatic default, C as an override.** Display rule: `nickname ?? "<authenticatorName> · <platform> · added <date>"`, falling back to "Passkey · added <date>" when neither AAGUID nor UA is usable.

### Where the work lands

| Party | Work |
| --- | --- |
| **BED** | Persist per credential: `aaguid`, `transports`, `backedUp`, `createdAt`, `lastUsedAt`, plus `authenticatorName` (from AAGUID lookup), `platformLabel` (from UA), `nickname`. Expose `GET /passkeys`, `PATCH /passkeys/:id`, `DELETE /passkeys/:id` for the authenticated customer. Update `lastUsedAt` and the backed-up flag on every successful sign-in. |
| **Frontend / proxy** | If the BED prefers not to parse user agents, the Next.js route that proxies `register/verify` can derive `platformLabel` (it sees the request headers) and the AAGUID name, and pass both to the BED to persist. The proxy stays stateless; the BED remains the single source of truth. |
| **Frontend UI** | "Your passkeys" list on the account page: name, type badge (Synced / Device-bound), last used, rename, revoke. Reuses the existing `StoredPasskeyCard`. |
| **Revocation hygiene** | After `DELETE`, call the **Signal API** (`signalAllAcceptedCredentials`) so the user's password manager hides the revoked passkey. Best-effort, feature-detected; already wired in the demo's Reset. |

### Contract additions

```ts
interface PasskeyCredentialSummary {
  // existing: id, publicKey, counter, transports, type, backedUp, aaguid, createdAt, lastUsedAt
  name: string;                     // display label, computed as above
  authenticatorName: string | null; // from AAGUID lookup
  platformLabel: string | null;     // from user agent at registration
  nickname: string | null;          // user-set
}
// GET    /passkeys            → PasskeyCredentialSummary[]
// PATCH  /passkeys/:id        { nickname } → PasskeyCredentialSummary
// DELETE /passkeys/:id        → { revokedId, remainingIds }   (frontend then signals the authenticator)
```

### How it will be demonstrated

The mock relying party plays both server and proxy today, so the demo page can show the finished behaviour — a list reading "iCloud Keychain · Safari on iPhone · added 16 Sep 2026" with rename and revoke — while the contract tells the BED exactly which fields to produce.

---

## Use case 2 — "On iPhone/tablet, auto-detect a passkey for the domain and trigger the nudge"

### The constraint to state up front

Same privacy rule: the site cannot *ask* whether a passkey exists. What it **can** do is *invite* the browser to use one in ways that are silent when there is none. Three mechanisms exist; they differ in how "automatic" they are and how widely they are supported. The recommendation is to layer them.

### Option A — Conditional UI (passkey autofill) — **baseline, ship first**

Call `navigator.credentials.get()` with `mediation: "conditional"` when the sign-in view loads, and mark the email field `autocomplete="username webauthn"`. When the user taps the field, the OS autofill bar offers their passkey for this domain; if they have none, nothing appears and the field behaves normally. One tap completes sign-in — no username, no button.

- SimpleWebAuthn: `startAuthentication({ optionsJSON, useBrowserAutofill: true })`.
- Support: iOS/iPadOS 16+ Safari, Android Chrome, desktop Chrome/Edge/Safari. The most mature of the three.
- Fit for the OTP flow: the existing `OtpStart` field becomes the autofill anchor — a passkey user never reaches the OTP.

### Option B — Immediate mediation — **the literal "auto-trigger"**

`navigator.credentials.get({ mediation: "immediate", ... })` tells the browser: *if a passkey exists for this RP ID, show the sheet now; if not, reject instantly (`NotAllowedError`) with no UI.* That is exactly the requested behaviour — a detection-and-nudge in one call — and the rejection path falls straight through to the OTP form.

- New (WebAuthn Level 3 work; shipping in Chromium first, other engines following). **Must be feature-detected**: `PublicKeyCredential.getClientCapabilities()` → `immediateGet`. Where absent, Option A is the fallback.
- If the SDK version lacks a flag for it, it is one direct `navigator.credentials.get()` call using the SDK's option parsers.
- Caveat: only knows about passkeys in *this* browser's password manager; a user whose passkey is on their phone still needs Option C or the QR path.

### Option C — Relying-party hint — **works everywhere today**

The server knows it registered a *platform* passkey from this browser (`authenticatorAttachment: "platform"` in the response) and that this browser last signed in with one. Set a first-party cookie or flag; on return, show "Sign in with your passkey" as the primary action before anything else. It is an inference, not a detection, but it is what most production sites use, and it costs nothing.

### Always available: cross-device sign-in

Whatever the mechanism, a phone can act as the authenticator for a desktop (hybrid transport, QR code), so "no passkey on this device" is never a dead end.

### Recommended sequence on the sign-in step

1. **On load:** read `getClientCapabilities()`.
2. **If `immediateGet`:** try immediate mediation. Success → signed in. Instant rejection → continue.
3. **Else / on rejection:** start conditional UI on the email field (Option A) so the autofill nudge is there if the user taps.
4. **If the RP hint says this browser has a passkey (Option C):** render "Sign in with your passkey" as the primary button above the OTP form; otherwise OTP is primary and passkey is secondary.
5. **Fallback path unchanged:** OTP as today.

### Where the work lands

| Party | Work |
| --- | --- |
| **BED** | Nothing new for Options A/B — the existing `login/options` endpoint already returns discoverable-credential options with an empty `allowCredentials`. For Option C, return `authenticatorAttachment` on `register/verify` and `login/verify` so the frontend can set the hint. |
| **Frontend** | Capability detection; immediate-mediation attempt with fallback; conditional UI wiring on `OtpStart`'s field; hint cookie; and the `useAuth` / `AuthOverlay` sequencing so passkey is offered before OTP (`acr: 2`, `evidence: ["passkey"]` in the existing model). |
| **Product** | Copy for the nudge and for the fallback when a passkey exists but the user cancels the prompt. |

### Browser-support summary (feature-detect, never assume)

| Mechanism | iPhone / iPad Safari | Android Chrome | Desktop Chrome / Edge | Desktop Safari | Detection |
| --- | --- | --- | --- | --- | --- |
| Conditional UI (A) | ✅ | ✅ | ✅ | ✅ | `getClientCapabilities().conditionalGet` / `isConditionalMediationAvailable()` |
| Immediate mediation (B) | rolling out | ✅ recent versions | ✅ recent versions | rolling out | `getClientCapabilities().immediateGet` |
| RP hint (C) | ✅ | ✅ | ✅ | ✅ | none needed |
| Cross-device / QR | ✅ | ✅ | ✅ | ✅ | `getClientCapabilities().hybridTransport` |

### How it will be demonstrated

The demo page gets a capabilities readout (so the client sees what *their* device supports), the immediate-mediation attempt with visible fallback, conditional UI on the email field, and the hint-driven nudge. On an iPhone with a registered passkey the page opens straight into the passkey sheet; on a device without one, it falls through to the form with no flicker.

---

## Summary of decisions requested from the client

1. **Naming:** approve the display rule `nickname ?? "<authenticator> · <platform> · added <date>"` and the three BED endpoints (`GET/PATCH/DELETE /passkeys`).
2. **Nudge:** approve the layered approach (immediate → conditional UI → RP hint → OTP) and that passkey is offered *before* OTP when available.
3. **Label ownership:** confirm whether the BED will compute `authenticatorName`/`platformLabel` itself or accept them from the Next.js proxy at registration (recommended if the BED wants to stay thin).

## Effort (frontend, demo-quality)

| Item | Estimate |
| --- | --- |
| Contract additions + mock endpoints + "Your passkeys" list with rename/revoke + Signal API | 1–1.5 days |
| Capability readout + immediate mediation + conditional UI + hint nudge on the demo page | 1 day |
| Integration into `AuthOverlay` / `GuardedLink` (passkey before OTP) | 1 day |
| Docs page updates and client walkthrough | 0.5 day |
