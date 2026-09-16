# Passkey feature: flow and file guide

A walkthrough of the passkey implementation in `apps/web` for the team: how a passkey is created and used, what each file does, which parts are permanent and which are throwaway, and how the demo pages exercise it. Read top to bottom the first time; afterwards the file tables are the reference.

---

## 1. The big picture

A passkey is a public/private key pair. The private key stays on the user's authenticator (Face ID, Touch ID, Windows Hello, a password manager, or a security key). The site, called the relying party (RP), keeps only the public key. Signing in means the browser asks the authenticator to sign a random challenge from the RP, and the RP verifies the signature with the public key it stored.

Three parties take part in every ceremony:

| Party | In this project |
| --- | --- |
| Relying party (RP) | The mock server in `features/auth/passkey/mock-server/` on the routes under `/api/auth/passkey/*`. Later: the upstream BED service on the same routes. |
| Client | The browser. Our code talks to it through `@simplewebauthn/browser` and, for the newer mediation modes, `navigator.credentials` directly. |
| Authenticator | The user's device or password manager. We never talk to it directly; the browser does. |

The code is split into a KEEP layer (contract, browser client, UI) that survives when the BED arrives, and a THROWAWAY layer (mock server, its routes) that is deleted at that point. The docs pages and demos sit on top and only exist in development.

```
apps/web/src/
  features/auth/
    passkey/
      contract.ts              KEEP     API contract (types + endpoint paths)
      client.ts                KEEP     browser client: register, sign in, list, rename, revoke
      nudge.ts                 KEEP     capabilities, immediate mediation, conditional UI, RP hint
      index.ts                 KEEP     public exports of the passkey module
      mock-server/
        server.ts              THROWAWAY  relying party logic (real WebAuthn verification)
        store.ts               THROWAWAY  JSON file storage
        label.ts               THROWAWAY (moves to the proxy)  readable names
        aaguids.json           THROWAWAY (moves to the proxy)  authenticator model list
        handler.ts             THROWAWAY  route handler wrapper
    components/
      passkey-panel.tsx        KEEP     the demo/sign-in panel that composes everything
      passkey-list.tsx         KEEP     "Your passkeys" with rename and revoke
      stored-passkey-card.tsx  KEEP     "what the server stored" card
      passkey-capabilities.tsx KEEP     what this browser supports
      passkey-flow-log.tsx     demo     trace of the nudge layers
      passkey-policy-controls.tsx  demo registration policy switcher
      passkey-options-readout.tsx  demo the options the browser received
    hooks/
      use-passkey-nudge.ts     KEEP     runs the nudge layers in order
    index.ts                   feature public surface (adds passkey exports)
  app/api/auth/passkey/**/route.docs.ts   THROWAWAY  dev-only routes to the mock server
  docs/demos/passkey.tsx                  demo       registers the three demo variants
content/docs/design-system/passkey.mdx    docs       the test page
docs/PASSKEY-*.md                         docs       reference and approach documents
```

`route.docs.ts` files are routes only in `next dev` or with `ENABLE_DOCS=true`. A normal `pnpm build` does not include them, so the mock server never ships.

---

## 2. The flows, step by step

### 2.1 Create a passkey (registration)

```
PasskeyPanel (CreatePasskeyForm)
   │ registerPasskey({ name, email, policy? })                client.ts
   ▼
POST /api/auth/passkey/register/options                        route.docs.ts → handler.ts → server.ts registrationOptions()
   • find or create the user; user handle is 32 random bytes, never the email
   • build PublicKeyCredentialCreationOptions with the registration policy
     (authenticatorSelection, hints, excludeCredentials, attestation "none")
   • store the challenge in memory, keyed by an httpOnly cookie
   ▼
startRegistration({ optionsJSON })                             @simplewebauthn/browser
   • browser shows "Choose where to save your passkey"
   • authenticator creates the key pair, user approves with biometric/PIN
   ▼
POST /api/auth/passkey/register/verify                         server.ts registrationVerify()
   • read the challenge cookie, check it matches and has not expired
   • verifyRegistrationResponse(): origin, RP ID, signature, user verification flag
   • compute labels (label.ts): authenticator name from AAGUID, platform from user agent
   • store the credential (store.ts) with public key, counter, transports, backed-up flag
   • set the session cookie; set the passkey-hint cookie if the authenticator was "platform"
   ▼
PasskeyPanel shows StoredPasskeyCard and PasskeyList
```

### 2.2 Sign in with a passkey (authentication)

```
"Sign in with passkey" button, or a nudge layer
   │ signInWithPasskey()                                       client.ts
   ▼
POST /api/auth/passkey/login/options                           server.ts authenticationOptions()
   • options with an EMPTY allowCredentials: the browser offers every passkey
     it has for this RP ID (discoverable credentials, no username needed)
   • challenge stored, cookie set
   ▼
startAuthentication({ optionsJSON })                           @simplewebauthn/browser
   • browser shows the passkey sheet, user approves
   ▼
POST /api/auth/passkey/login/verify                            server.ts authenticationVerify()
   • look up the credential by the ID the browser returned
   • verifyAuthenticationResponse() with the stored public key and counter
   • update counter, last used, backed-up flag; set session and hint cookies
   ▼
PasskeyPanel shows the result and the list
```

### 2.3 Manage passkeys (use case 1)

```
PasskeyList mounts → listPasskeys()        GET  /passkeys          server.ts listPasskeys()
Rename            → renamePasskey()        PATCH /passkeys/:id     server.ts renamePasskey()
Revoke            → revokePasskey()        DELETE /passkeys/:id    server.ts revokePasskey()
                     then sendSignal({ signalName: "allAcceptedCredentials", remaining IDs })
                     so the password manager hides the revoked passkey (best effort)
```

All three require the session cookie; an anonymous call returns 401.

### 2.4 Detect and prompt (use case 2)

Runs while the panel is anonymous, in `usePasskeyNudge`:

```
1. readPasskeyHint()            passkey-hint cookie present? → "Sign in with your passkey" becomes primary
2. getPasskeyCapabilities()     what this browser supports (shown in PasskeyCapabilitiesCard)
3. signInWithPasskeyImmediate() only if immediateGet: browser shows the sheet at once if a
                                passkey exists, rejects instantly if not
4. armPasskeyAutofill()         only if conditionalGet: pending request so the email field's
                                autofill bar offers passkeys (autocomplete="username webauthn")
```

Every step writes a line to the flow log so the demo shows which layer did what. Only one WebAuthn request can be pending at a time, so the hook cancels the autofill request before any other ceremony and on unmount.

---

## 3. File by file

### 3.1 KEEP: `features/auth/passkey/`

**`contract.ts`**
The agreement between the browser code and the relying party. Hand this file to the BED team. It defines:

- `PASSKEY_ENDPOINTS`: `/register/options`, `/register/verify`, `/login/options`, `/login/verify`, `/passkeys`, `/passkeys/:id`, all relative to `NEXT_PUBLIC_PASSKEY_API_BASE` (default `/api/auth/passkey`).
- `PasskeyRegisterInput` (name, email, optional demo `policy`), `PasskeyRegistrationPolicy` (attachment, hints, residentKey, userVerification) and `DEFAULT_REGISTRATION_POLICY`.
- `PasskeyCredentialSummary`: what the RP returns about a passkey. Includes `name`, `authenticatorName`, `platformLabel`, `nickname`, `type` (synced or device-bound), `aaguid`, `transports`, `counter`, `createdAt`, `lastUsedAt`. Never a private key.
- `PasskeyRegisterResult`, `PasskeyLoginResult` (user, credential, `rpID`), `PasskeySession`, `PasskeyRenameInput`, `PasskeyRevokeResult`.
- Re-exports the WebAuthn JSON types from `@simplewebauthn/browser` so no other file imports the library's types directly.

**`client.ts`**
The browser side of the contract. All calls use `credentials: "same-origin"` because the challenge lives in a cookie.

- `registerPasskey(input, hooks)`: options → `startRegistration` → verify. `hooks.onOptions` receives the options exactly as the browser saw them (used by the policy demo).
- `signInWithPasskey()`: options → `startAuthentication` → verify.
- `listPasskeys()`, `renamePasskey(id, nickname)`, `revokePasskey(id, rpID, userID)`; revoke calls the Signal API afterwards.
- `getPasskeySession()` and `resetPasskeyDemo()`: mock only, remove with the mock server.
- `describePasskeyError(error)`: turns `WebAuthnError` codes into sentences ("The passkey prompt was cancelled.").
- `passkeysSupported()`: `browserSupportsWebAuthn()`.

**`nudge.ts`**
The three detection layers from the approach document.

- `getPasskeyCapabilities()`: reads `PublicKeyCredential.getClientCapabilities()` with fallbacks to the older `isConditionalMediationAvailable()` and `isUserVerifyingPlatformAuthenticatorAvailable()`. Returns `immediateGet`, `conditionalGet`, `hybridTransport`, `passkeyPlatformAuthenticator`, `userVerifyingPlatformAuthenticator` and the raw map.
- `signInWithPasskeyImmediate()`: `navigator.credentials.get({ uiMode: "immediate" })` (Chrome 149 and later; the origin-trial `mediation: "immediate"` no longer triggers it) using the native `parseRequestOptionsFromJSON`. Must follow a user gesture. Returns `signed-in`, `no-passkey`, `unsupported`, `cancelled` or `error`. An instant `NotAllowedError` means no passkey; the same error is raised when the user dismisses the sheet, so both are treated as "not now".
- `armPasskeyAutofill()` and `cancelPasskeyAutofill()`: conditional UI through `startAuthentication({ useBrowserAutofill: true })` and `WebAuthnAbortService.cancelCeremony()`.
- `readPasskeyHint()`: reads the non-httpOnly `passkey-hint` cookie set by the RP.

**`index.ts`**
Public exports of the module; `features/auth/index.ts` re-exports the ones other code should use.

### 3.2 THROWAWAY: `features/auth/passkey/mock-server/`

Delete this folder when the BED implements the contract. The cleanup list is at the top of `server.ts`.

**`server.ts`**
The relying party. It does real WebAuthn verification with `@simplewebauthn/server`; only the storage is fake.

- Policy constants: `USER_VERIFICATION = "required"`, `ATTESTATION = "none"`, and `resolvePolicy()` which merges the demo's requested policy over `DEFAULT_REGISTRATION_POLICY`. In production the RP would ignore the client's policy.
- `relyingPartyFor(request)`: RP ID and origin derived from the request host (works on localhost and ngrok), overridable with `RP_ID`, `RP_ORIGIN`, `RP_NAME`.
- Challenges: in memory, keyed by the `passkey-demo-challenge` cookie, five-minute expiry, consumed on use.
- Session: the `passkey-demo-session` cookie holds the user id. `sessionFor()`, `currentUser()`, `clearSession()`.
- Hint: `setHint()` writes `passkey-hint=platform` when the response's `authenticatorAttachment` was `platform`.
- `registrationOptions()`, `registrationVerify()`, `authenticationOptions()`, `authenticationVerify()`: the four contract endpoints. Verification errors from the library are mapped to a 400 with "Verification failed: …" by `verified()`.
- `listPasskeys()`, `renamePasskey()`, `revokePasskey()`: use case 1; all require a session.
- `summarize()`: converts a stored credential into `PasskeyCredentialSummary`, including the display name.
- `resetDemo()`: wipes the store, challenges and cookies; returns the user IDs so the client can signal authenticators.

**`store.ts`**
`apps/web/.data/passkey-demo.json` (gitignored). `StoredCredential` is the record shape a BED would persist: id, userId, publicKey (base64url), counter, transports, deviceType, backedUp, aaguid, authenticatorName, platformLabel, nickname, createdAt, lastUsedAt. Simple get/save/delete helpers. Not suitable for serverless hosts; swap for a database there.

**`label.ts`**
Readable names, use case 1. `authenticatorNameFor(aaguid)` looks up `aaguids.json` (all-zero AAGUID → null, shown as "Not disclosed"). `platformLabelFor(request)` parses the user agent into "Safari on iPhone", "Chrome on Windows" and so on. `displayNameFor()` applies the rule: nickname, else "authenticator · platform · added date", else "Passkey · added date". Written so it can move into the Next.js proxy route unchanged when the BED stores the fields.

**`aaguids.json`**
Vendored copy of the community authenticator list (56 entries: Apple Passwords, Google Password Manager, 1Password, Windows Hello, Bitwarden, and others). Refresh periodically from `github.com/passkeydeveloper/passkey-authenticator-aaguids`.

**`handler.ts`**
`mockRpRoute(fn)` wraps a server function as a route handler: awaits `connection()` (required with `cacheComponents`), parses the JSON body for POST and PATCH, maps `MockRpError` to its status, everything else to 500, and never leaks stacks.

### 3.3 THROWAWAY: `app/api/auth/passkey/**/route.docs.ts`

One file per endpoint, each a one-liner over `mockRpRoute`:

| Route | Method | Server function |
| --- | --- | --- |
| `register/options` | POST | `registrationOptions` |
| `register/verify` | POST | `registrationVerify` |
| `login/options` | POST | `authenticationOptions` |
| `login/verify` | POST | `authenticationVerify` |
| `passkeys` | GET | `listPasskeys` |
| `passkeys/[id]` | PATCH, DELETE | `renamePasskey`, `revokePasskey` |
| `session` | GET | `sessionFor` (mock only) |
| `reset` | POST | `resetDemo` (mock only) |

When the BED is live, either delete these or keep the path as a same-origin proxy so the challenge cookie stays first-party.

### 3.4 KEEP: `features/auth/components/`

**`passkey-panel.tsx`**
The composition root. Props: `showNudge` (run the detection layers and show the trace), `showPolicy` (registration policy controls and options readout), `showReset` (mock only). States: loading, unsupported, anonymous, signed-in. It loads the session on mount, runs `usePasskeyNudge` while anonymous, and on any successful ceremony calls `complete()` which stores the user and RP ID, shows the result card and refreshes the list. `CreatePasskeyForm` inside it holds the name and email fields; the email input has `autocomplete="username webauthn"` so conditional UI can attach to it. When the hint says a passkey exists, "Sign in with your passkey" is shown as the primary action and the secondary sign-in button is hidden.

**`passkey-list.tsx`**
"Your passkeys" for the signed-in user. Fetches the list, shows the display name, authenticator and platform, last used, a Synced or Device-bound badge and transports. Rename edits the nickname inline; Revoke deletes and signals the authenticator. Reloads when `version` changes (after a new registration).

**`stored-passkey-card.tsx`**
"What the server stored" after a ceremony: credential ID, public key (truncated), an explicit "Private key: not stored" row, counter, transports, AAGUID, dates, and the passkey type badge. This is the card that answers "what does the server actually keep".

**`passkey-capabilities.tsx`**
Renders the capabilities from `nudge.ts` as Yes/No rows with a plain explanation of what each one enables. Lets the client see on their own device which nudge layer will apply.

**`passkey-flow-log.tsx`** (demo)
Numbered trace of the nudge sequence.

**`passkey-policy-controls.tsx`** (demo)
Four presets (Consumer default, This device only, Security key only, Everything with no preference) plus the individual knobs: attachment, hints, residentKey, userVerification. Sent as `policy` on `register/options` so the "where to save" sheet can be compared live.

**`passkey-options-readout.tsx`** (demo)
Shows `rp.id`, `rp.name`, `authenticatorSelection`, `hints`, the number of excluded credentials and `attestation` exactly as the browser received them.

### 3.5 KEEP: `features/auth/hooks/use-passkey-nudge.ts`

Sequences the layers: hint → capabilities → wait for focus or the first click → immediate mediation → conditional UI. The wait exists because the browser allows one pending WebAuthn request per tab and the docs page has several previews; arming conditional UI on load would make every other passkey button fail with "A request is already pending". Calls `onSignedIn` when a layer completes a sign-in. Keeps a liveness flag and cancels the autofill request on cleanup. Returns `started` so the UI can tell whether the prompts have begun. Split into `tryImmediate()` and `tryConditional()` helpers to keep each function small.

### 3.6 Feature surface: `features/auth/index.ts`

Adds the passkey exports next to the existing `AuthProvider`, `GuardedLink`, `useAuth`, `useOtpFlow`. Feature code should import from `@features/auth`, not from deep paths.

### 3.7 Demo and docs

**`src/docs/demos/passkey.tsx`** registers three variants, keyed in `src/docs/demos/index.ts`:

| Key | Panel props | Shows |
| --- | --- | --- |
| `passkey` | `showNudge={false}` | plain create / sign in / list |
| `passkey-policy` | `showPolicy`, no nudge | registration policy presets and the options readout |
| `passkey-nudge` | `showNudge` | capabilities card, flow log, hint-driven primary button |

**`content/docs/design-system/passkey.mdx`** is the test page at `/docs/design-system/passkey`. Sections: demo script, testing on phones (ngrok), where things live, the contract table, "Your passkeys" and readable names, detecting and prompting with a test table, controlling the "where to save" sheet with a test matrix, policy choices baked in, next steps for the OTP flow, and the embedded source of the contract, client and panel.

**`docs/PASSKEY-REGISTRATION-OPTIONS.md`** explains `authenticatorSelection`, `excludeCredentials` and `attestation`. **`docs/PASSKEY-APPROACH-LISTING-AND-NUDGE.md`** is the client-facing approach for use cases 1 and 2.

### 3.8 Configuration touched

| File | Change |
| --- | --- |
| `apps/web/package.json` | `@simplewebauthn/browser` and `@simplewebauthn/server` (`^14.0.0`). The server package goes when the mock does. |
| `src/config/env-schema.ts`, `src/config/client-env.ts` | `NEXT_PUBLIC_PASSKEY_API_BASE` (optional). Unset means the same-origin mock. |
| `apps/web/.env.local.example` | Commented `RP_ID`, `RP_ORIGIN`, `RP_NAME` and the API base. |
| `.gitignore` | `.data/` for the mock store. |
| `AGENTS.md` | A section describing the passkey layout and the cleanup rule. |

---

## 4. Cookies used by the mock

| Cookie | httpOnly | Set when | Read by |
| --- | --- | --- | --- |
| `passkey-demo-challenge` | yes | `*/options` | the matching `*/verify`, then deleted |
| `passkey-demo-session` | yes | successful verify | `session`, `passkeys` endpoints |
| `passkey-hint` | no | verify with a platform authenticator | `readPasskeyHint()` in the browser |

The BED will replace the session with its own mechanism and hand off to the assurance engine; the challenge cookie stays the RP's concern, which is why a same-origin proxy is recommended.

---

## 5. Running the demo

1. `pnpm dev`, open `http://localhost:3000/docs/design-system/passkey`.
2. No device to hand: Chrome DevTools, More tools, WebAuthn, enable the virtual authenticator environment, add a `ctap2` / `internal` authenticator with resident keys and user verification on.
3. For phones: `ngrok http 3000` and open the HTTPS URL on each device. Passkeys are bound to the RP ID, so create them on the URL you will demo from.
4. Walk the three previews in order: create and sign in; the registration policy sheet comparison; the nudge trace after a reload.
5. Reset demo at the bottom wipes the store and asks the password manager to hide the old passkeys.

## 6. What changes when the BED is ready

1. Set `NEXT_PUBLIC_PASSKEY_API_BASE` to the BED (or proxy `/api/auth/passkey/*` to it and leave the variable unset).
2. Delete `features/auth/passkey/mock-server/` and the `route.docs.ts` files (or turn the latter into proxies).
3. Move `label.ts` and `aaguids.json` into the proxy route if the BED does not compute names itself.
4. Remove `@simplewebauthn/server`, `getPasskeySession`, `resetPasskeyDemo` and the Reset link.
5. Nothing else changes: contract, client, nudge layers, components and docs stay as they are.

## Debug logging

All logging is development only.

- Terminal (`pnpm dev`): `mock-server/handler.ts` logs every request as `→ METHOD path` with the body and cookie names, and every response as `← status path` with the JSON returned or the error. Scope is `mock-rp`. Long strings are truncated.
- Browser console, `[passkey client]`: each fetch to the mock, the creation or request options handed to the browser, and the authenticator response sent back.
- Browser console, `[passkey nudge]`: the immediate mediation and conditional UI calls.
