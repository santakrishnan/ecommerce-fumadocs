# Passkey endpoints: how each one works today, and what changes when the BED API arrives

**Audience:** frontend team, BED team
**Companion documents:** `PASSKEY-FLOW-AND-FILES.md` (where the files are), `PASSKEY-REGISTRATION-OPTIONS.md` (what the options mean), `PASSKEY-APPROACH-LISTING-AND-NUDGE.md` (why the list and nudge endpoints exist)

This document answers three questions the team has asked:

1. What does each `/api/auth/passkey/*` endpoint receive, do and return?
2. What is a "proxy" here, and why do we route through Next.js at all?
3. When the upstream BED passkey API is available, do the endpoints stay the same? (Short answer: the paths, methods and JSON shapes stay the same. Only what sits behind the route changes.)

---

## 1. The shape of the system

```
Browser (client.ts, nudge.ts)
   │  fetch, same-origin, credentials: "same-origin"
   ▼
Next.js route handler   app/api/auth/passkey/<endpoint>/route.docs.ts
   │  mockRpRoute(): parse body, log, map errors
   ▼
Relying party logic     TODAY: mock-server/server.ts (in-process, @simplewebauthn/server, in-memory store)
                        LATER: a thin call to the BED passkey API, same request and response JSON
```

Three pieces, and only the bottom one is throwaway:

| Piece | File | Status | Why |
| --- | --- | --- | --- |
| Contract | `features/auth/passkey/contract.ts` | keep | Paths and JSON types. The browser client and the BED both build against it. |
| Browser client | `features/auth/passkey/client.ts`, `nudge.ts` | keep | Runs the WebAuthn ceremonies and calls the endpoints. Knows nothing about who implements them. |
| Route handlers | `app/api/auth/passkey/**/route.docs.ts` | keep the path, change the body | Today they call the mock in-process. Later they forward to the BED. |
| Mock relying party | `features/auth/passkey/mock-server/*` | throwaway | Fake storage and session. Real verification. |

The word "proxy" in the earlier write-ups means the Next.js route handler layer. It is the same BFF (backend for frontend) pattern the rest of the app already uses: `app/api/v1/auth/otp/start/route.ts` calls `features/otp/bff`, which today calls `mockStartOtp()` and later will call the EDI passwordless API. The passkey routes follow that pattern with one difference: they live at `route.docs.ts`, so they are compiled only when `ENABLE_DOCS=true`, because today there is nothing real behind them.

---

## 2. Why a same-origin proxy and not a direct call to the BED

Passkeys make this a firm requirement rather than a preference.

**The challenge must be bound to the browser session.** Every ceremony is two calls: `options` hands out a random challenge, `verify` checks that the authenticator signed that exact challenge. Something has to remember the challenge between the two calls and tie it to the browser that asked. We do that with an httpOnly cookie (`passkey-demo-challenge`) set by `options` and read by `verify`. Cookies are first-party only when the request goes to our own origin. If the browser called `api.bed.example` directly, the cookie would be third-party, blocked by Safari and increasingly by Chrome, and the flow would break on iPhone first.

**The RP ID and expected origin must match the page.** `verifyRegistrationResponse` checks that the signed `clientDataJSON` carries `origin: https://our-site` and that the RP ID hash matches `our-site`. The route handler is on that origin and can derive both from the request headers (`relyingPartyFor()` reads `host` and `x-forwarded-proto`). A BED on another host has to be told, and the proxy is the natural place to add that.

**The proxy sees the request headers.** `platformLabel` ("Safari on iPhone") is computed from `user-agent` at registration time. If the BED does not want to parse user agents, the proxy can compute the label and pass it along, which is the option recommended in the approach document.

**The session cookie is ours.** After a successful `verify`, the proxy sets the app session (today `passkey-demo-session`; later whatever `useAuth` and the OTP flow use). The BED returns "verified, here is the user"; the proxy turns that into a signed-in browser.

**Secrets stay server-side.** Any BED API key or service token lives in the route handler's environment, never in the browser bundle.

---

## 3. Endpoint by endpoint

All paths are relative to the API base, `/api/auth/passkey` by default (`NEXT_PUBLIC_PASSKEY_API_BASE` overrides it). All bodies and responses are JSON. Errors are `{ "error": "message" }` with an HTTP status. Every response carries `Cache-Control: no-store`.

### 3.1 `POST /register/options`

**Purpose.** Start passkey creation. Hands the browser a `PublicKeyCredentialCreationOptionsJSON` that drives the "Choose where to save your passkey" sheet.

**Request.** `{ "email": "…", "name": "…", "policy"?: { attachment, hints, residentKey, userVerification } }`. `policy` exists only so the demo can switch policies live. A real RP ignores it or validates it against an allow-list.

**What the mock does.**
1. Validates name and email.
2. Finds or creates the user. The WebAuthn `user.id` is 32 random bytes, base64url, never the email (spec recommendation: the handle must not be personal data because the authenticator stores it).
3. Builds options with `generateRegistrationOptions`: RP name and ID from the request, `attestation: "none"`, `excludeCredentials` = every credential already stored for this user (so the same authenticator refuses to create a duplicate), `authenticatorSelection` from the policy, `hints` from the policy.
4. Stores the challenge in memory under a random key with a 5-minute TTL, tagged `purpose: "register"` and the user ID, and sets that key in the httpOnly `passkey-demo-challenge` cookie.

**Response.** The options object exactly as the browser needs it. The demo's "options readout" shows this JSON.

**With the BED.** The proxy forwards `{ email, name }` (dropping `policy`), receives the options plus a challenge reference, and sets the challenge cookie itself. If the BED keeps its own challenge state, the cookie holds the BED's challenge ID; if not, the proxy stores it (Redis, or a signed cookie holding the challenge itself). Either way the browser client does not change.

### 3.2 `POST /register/verify`

**Purpose.** Finish passkey creation. Receives the authenticator's attestation response and stores the public key.

**Request.** `RegistrationResponseJSON`: `id`, `rawId`, `type`, `response.clientDataJSON`, `response.attestationObject`, `response.transports`, `authenticatorAttachment`, `clientExtensionResults`. This is `credential.toJSON()` from the browser; `startRegistration()` produces it.

**What the mock does.**
1. Reads and deletes the challenge cookie; loads and deletes the pending challenge. Fails with 400 if there is none, it is for the wrong purpose, or it has expired. Challenges are single use.
2. `verifyRegistrationResponse` checks: the signed challenge equals the stored one; `clientDataJSON.origin` equals the expected origin; the RP ID hash equals the expected RP ID; the user-verified flag is set (because our policy is `userVerification: "required"`); the attestation object parses. A forged or malformed response is a 400, not a crash.
3. Stores the credential: `id`, public key (COSE, base64url), signature counter, transports, `credentialDeviceType` (single or multi-device), `credentialBackedUp`, AAGUID, plus the labels `authenticatorName` (from the AAGUID list) and `platformLabel` (from the user agent), `nickname: null`, timestamps.
4. Sets the session cookie for the user.
5. If `authenticatorAttachment` is `"platform"`, sets the readable `passkey-hint` cookie for a year. This is what drives "Sign in with your passkey" as the primary button on return.

**Response.** `PasskeyRegisterResult`: `{ user, credential, rpID }`. `credential` is the `PasskeyCredentialSummary` the list will show; `rpID` is kept by the client for the Signal API.

**With the BED.** The proxy forwards the response JSON plus the challenge reference from the cookie, and, if agreed, the computed `platformLabel` and `authenticatorName`. The BED verifies and stores. The proxy sets the app session and the hint cookie from the BED's answer. Steps 4 and 5 stay in the proxy because they are about our cookies, not the BED's data.

### 3.3 `POST /login/options`

**Purpose.** Start sign-in. Used by the button, by conditional UI and by immediate UI mode alike.

**Request.** `{}`. No username. Sign-in is by discoverable credential: the browser lists whatever passkeys it holds for the RP ID.

**What the mock does.** `generateAuthenticationOptions` with the RP ID, `userVerification: "required"` and no `allowCredentials`. Stores the challenge with `purpose: "login"` and sets the challenge cookie.

**Response.** `PublicKeyCredentialRequestOptionsJSON`: `challenge`, `rpId`, `timeout`, `userVerification`, empty `allowCredentials`.

**Notes for the three callers.**
- Button: `signInWithPasskey()` fetches options, then `startAuthentication({ optionsJSON })`.
- Conditional UI: `armPasskeyAutofill()` fetches options, then `startAuthentication({ optionsJSON, useBrowserAutofill: true })`. The request stays pending until the user picks a passkey from the autofill bar. The 5-minute challenge TTL matters here: if the field sits idle longer than that, the eventual `verify` fails with "Challenge expired" and the client should re-arm. The mock's TTL is short for safety; the BED can choose a longer one for the conditional case.
- Immediate UI mode: `signInWithPasskeyImmediate()` fetches options, converts them with `parseRequestOptionsFromJSON`, and calls `navigator.credentials.get({ publicKey, uiMode: "immediate" })`. Same options, same verify.

**With the BED.** Proxy forwards `{}`, receives options, sets the challenge cookie. Nothing else.

### 3.4 `POST /login/verify`

**Purpose.** Finish sign-in.

**Request.** `AuthenticationResponseJSON`: `id`, `rawId`, `type`, `response.clientDataJSON`, `response.authenticatorData`, `response.signature`, `response.userHandle`, `authenticatorAttachment`.

**What the mock does.**
1. Consumes the login challenge (same rules as registration).
2. Looks up the credential by `response.id`. 404 if unknown, with a message that says the demo may have been reset, because that is the usual cause on a dev machine: the browser still has the passkey, the in-memory store does not.
3. `verifyAuthenticationResponse` checks challenge, origin, RP ID, user-verified flag, and the signature against the stored public key. It also compares the signature counter: a counter that did not increase can mean a cloned authenticator. Synced passkeys always report 0, which the library accepts.
4. Updates the stored counter, backed-up flag, device type and `lastUsedAt`.
5. Sets the session cookie and, for a platform authenticator, the hint cookie.

**Response.** `PasskeyLoginResult`: `{ user, credential, rpID }`.

**With the BED.** Forward the response and challenge reference; the BED verifies and returns the user; the proxy sets the session and hint cookies.

### 3.5 `GET /passkeys`

**Purpose.** "Your passkeys" on the account page.

**Request.** No body. Requires the session cookie; 401 "Sign in first." otherwise.

**What the mock does.** Returns the signed-in user's credentials, newest first, each as a `PasskeyCredentialSummary`. `name` is computed by `displayNameFor()`: the nickname if set, otherwise `<authenticatorName> · <platformLabel> · added <date>`, falling back to `Passkey · added <date>`. `type` is `synced` when `credentialDeviceType` is multi-device, `device-bound` otherwise. An all-zero AAGUID is returned as the string `"Not disclosed"`.

**With the BED.** Proxy calls the BED's list endpoint with the user identity from the session. If the BED stores only raw fields, the proxy can compute `name`, `type` and the "Not disclosed" substitution. `label.ts` and `summarize()` in `server.ts` are the reference for that computation and are worth keeping even after the mock goes.

### 3.6 `PATCH /passkeys/:id`

**Purpose.** Rename.

**Request.** `{ "nickname": "Work laptop" }` or `{ "nickname": null }` to clear. Trimmed, capped at 60 characters, empty becomes null.

**What the mock does.** 401 without a session, 404 if the credential does not exist or belongs to another user, otherwise stores the nickname and returns the updated summary.

**With the BED.** Straight forward. The ownership check must stay server-side.

### 3.7 `DELETE /passkeys/:id`

**Purpose.** Revoke.

**Request.** No body. Session required.

**What the mock does.** Same ownership checks, deletes the credential, and returns `PasskeyRevokeResult`: `{ revokedId, remainingIds }`. `remainingIds` is the complete list of credential IDs still valid for the user.

**Why `remainingIds` is in the response.** The browser client then calls `sendSignal({ type: "all-accepted-credentials", rpId, userId, allAcceptedCredentialIds: remainingIds })`. The password manager compares that list with what it holds for this RP ID and user, and hides anything not on the list. Without it, the user would still see the revoked passkey in Apple Passwords or Chrome and get a confusing failure the next time they picked it. The call is best effort and feature detected.

**With the BED.** The BED must return the remaining IDs (or the proxy must fetch the list after deleting). Do not drop this field; it is the difference between revoke feeling right and feeling broken.

### 3.8 `GET /session` (demo only)

Returns `{ user, rpID }` so the panel knows whether to show the anonymous or signed-in state on load. Does not exist in the product: the real app knows its session through `useAuth`. Goes with the mock (cleanup checklist in `server.ts`, item 4).

### 3.9 `POST /reset` and the "Reset demo" link (demo only)

**Purpose.** Put the mock back to a clean state so the next walkthrough starts as a new user on a new device, and clean up the browser side so stale passkeys do not linger in the password manager.

**What happens when you click the link.** `resetPasskeyDemo()` in `client.ts` does two things in order.

1. `POST /reset` with an empty body. On the server, `resetDemo()`:
   - collects the IDs of every user in the store;
   - empties the store (all users, all credentials) and the pending challenge map;
   - deletes all three cookies: `passkey-demo-session` (you are signed out), `passkey-demo-challenge` (any half-finished ceremony is void) and `passkey-hint` (the next load shows the form, not "Sign in with your passkey");
   - returns `{ rpID, userIDs }`.
2. For each returned `userID`, the browser calls `sendSignal({ signalName: "allAcceptedCredentials", rpID, userID, allAcceptedCredentialIDs: [] })`. An empty accepted list tells the password manager that no credential is valid for that user on this RP ID, so it hides (Apple Passwords, Google Password Manager) every passkey it holds for them. Each call is wrapped in `.catch(() => undefined)`: on a browser without the Signal API, or when the provider declines, the reset still completes.

The panel then sets its state to anonymous and clears the last result. Reload is not required.

**What reset does not do.** It does not delete the private keys on your device. The Signal API asks the provider to hide credentials it now knows are dead; whether it hides or deletes them is up to the provider, and a provider without Signal API support (Firefox, some third-party managers, Chrome's local profile store on older versions) keeps showing them. If a stale passkey still appears in the sheet after a reset, delete it by hand: Apple Passwords on macOS and iOS, `chrome://password-manager/passwords` for Google Password Manager, or `chrome://settings/passkeys` for passkeys saved to the Chrome profile. Picking a stale passkey at sign-in returns the 404 "This passkey is not registered here (was the demo reset?)" from `/login/verify`.

**Why it exists.** The mock store is in memory and empties on every dev-server restart, but the browser keeps its passkeys. Without reset, every restart leaves orphaned passkeys in the sheet and the next registration is refused by `excludeCredentials` for the same email. Reset is the one-click way to get the two sides back in step, and it doubles as the Signal API demo: open Apple Passwords or `chrome://settings/passkeys` next to the page, click Reset, and watch the entries go.

**In production.** There is no reset. The equivalent user actions are revoke (section 3.7), which signals the remaining list, and account deletion, which should signal an empty list the same way `resetDemo` does for each user. The `/reset` route, `resetDemo()`, `resetPasskeyDemo()` and the link in `PasskeyPanel` (`showReset`) all go with the mock.

---

## 4. The cookies

| Cookie | Set by | Read by | httpOnly | Lifetime | Production equivalent |
| --- | --- | --- | --- | --- | --- |
| `passkey-demo-challenge` | `*/options` | `*/verify` | yes | 5 minutes, deleted on verify | Stays. Rename; hold a BED challenge reference or a signed challenge. |
| `passkey-demo-session` | `*/verify` | list, rename, revoke, session | yes | 24 hours | Replaced by the app's real session (whatever the OTP flow sets). |
| `passkey-hint` | `*/verify`, platform attachment only | `readPasskeyHint()` in the browser | no | 1 year | Stays as is. It is a UX hint, not a security signal; it only decides which button is primary. |

---

## 5. What is fake and what is real in the mock

| Concern | Mock | Real |
| --- | --- | --- |
| Challenge generation and single-use enforcement | in-memory map | real behaviour, fake storage |
| Signature, origin, RP ID, user-verification checks | `@simplewebauthn/server` | real |
| Counter check for cloned authenticators | real | real |
| AAGUID to name, user agent to platform label | `label.ts` | real; reusable |
| User and credential storage | in-memory, lost on restart | fake |
| Session | a cookie holding the user ID | fake; not signed |
| Relying party identity | derived from `host` header | acceptable for dev; production pins `RP_ID` and `RP_ORIGIN` |

"Lost on restart" is why sign-in sometimes returns 404 "not registered here" on a dev machine: the passkey is still in the browser, the store is empty. Use Reset, then create again.

---

## 6. The switch to the BED, step by step

The client, the contract and the docs page do not change. The work is in the route handlers and in deleting the mock.

1. **Agree the BED contract against `contract.ts`.** Same JSON shapes (they are the WebAuthn L3 standard shapes, so any server library produces them). The BED needs to return `rpID` on verify and `remainingIds` on revoke, and should store `aaguid`, `transports`, `backedUp`, `createdAt`, `lastUsedAt`, `nickname`, and either compute or accept `authenticatorName` and `platformLabel`.
2. **Decide who holds the challenge between `options` and `verify`.** Options: the BED returns a challenge ID that the proxy puts in the cookie; or the proxy stores the challenge itself in a shared store; or the proxy sets a signed, short-lived cookie containing the challenge. All three keep the browser client unchanged.
3. **Replace the body of each route handler.** Keep the path and method. Replace `registrationOptions(request, body)` with a call to a `features/auth/passkey/bff/` service that forwards to the BED, following the `features/otp/bff` layout (contracts, services, use-cases, errors). The `mockRpRoute` wrapper can be renamed and kept; its body parsing, error mapping and request/response logging are useful regardless.
4. **Rename `route.docs.ts` to `route.ts`** so the endpoints are part of the product build, and drop `ENABLE_DOCS` from the passkey mentions in `next.config.ts`.
5. **Wire the session.** On successful verify, set whatever the OTP flow sets today so `useAuth` sees a signed-in user, with the assurance level and evidence the auth model expects (`acr: 2`, `evidence: ["passkey"]` in the current model).
6. **Delete** `features/auth/passkey/mock-server/` (keep `label.ts` and `aaguids.json` if the proxy computes labels), the `/session` and `/reset` routes, `getPasskeySession`, `resetPasskeyDemo` and the Reset link, and `@simplewebauthn/server` from `package.json` if nothing else uses it.
7. **Pin the relying party.** Set `RP_ID` and `RP_ORIGIN` explicitly per environment rather than deriving them from headers. The RP ID is permanent once users have passkeys; changing it orphans every passkey.

Optionally, `NEXT_PUBLIC_PASSKEY_API_BASE` lets the browser client point somewhere other than `/api/auth/passkey`. It exists for flexibility, but for the cookie reasons in section 2 it should stay a same-origin path.

---

## 7. Sequence in one picture

```
Create
  browser  ── POST /register/options {email,name} ──▶ proxy ── (BED) ──▶ options + challenge
  browser  ◀─ options JSON, Set-Cookie: challenge ───┘
  browser: navigator.credentials.create(options)  → user picks where to save, Face ID
  browser  ── POST /register/verify {attestation} ──▶ proxy ── (BED) ──▶ verify, store public key
  browser  ◀─ {user, credential, rpID}, Set-Cookie: session, hint ─┘

Sign in (button, autofill or immediate: same two calls)
  browser  ── POST /login/options {} ──▶ proxy ── (BED) ──▶ options + challenge
  browser  ◀─ options JSON, Set-Cookie: challenge ─┘
  browser: navigator.credentials.get(options)      → user picks a passkey, Face ID
  browser  ── POST /login/verify {assertion} ──▶ proxy ── (BED) ──▶ verify signature, bump counter
  browser  ◀─ {user, credential, rpID}, Set-Cookie: session, hint ─┘

Manage (session cookie on every call)
  GET    /passkeys          → list
  PATCH  /passkeys/:id      → rename
  DELETE /passkeys/:id      → {revokedId, remainingIds}  → browser: sendSignal(all-accepted-credentials)
```

Every arrow in the "Create" and "Sign in" blocks appears in the terminal as a `[mock-rp]` line and in the browser console as a `[passkey client]` line, so the demo can show the traffic live.
