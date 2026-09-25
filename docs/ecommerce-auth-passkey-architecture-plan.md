# Passkey architecture review and implementation plan

**Reviewed:** 2026-09-24; updated for the VPS team's EDI-session decision  
**Codebase:** `/Users/santhana/dev/ecommerce-auth/web-test`  
**Scope:** architecture and plan only; no application code changed.

## Goal and decision

Deliver a local, end-to-end demonstration of OTP enrollment, passkey registration, passkey sign-in, listing, and deletion through the Next.js BFF. Keep the browser-to-BFF contract aligned with `api-spec-v2-draft.yaml`; the BFF mock implements real WebAuthn verification with `@simplewebauthn/server`. Later, replace only the server adapter with VPS/EDI calls. The application never calls EDI or Auth0 directly.

For the demo, **store public-key credential records and outstanding challenges in server process memory**. Set only a random, opaque BFF session handle in an HttpOnly cookie. The browser/passkey provider stores the private key. Do not put credential records or public keys in a cookie. In-memory state is intentionally lost on a server restart and is suitable only for a single-process local demo, not a serverless or multi-instance deployment.

**Updated upstream assumption:** VPS will not expose an account ID to this application. Successful OTP verify and later `/resolve` responses will contain an opaque EDI session value in a **response field**. The Next.js BFF should read that field server-side, keep the EDI session in its server-side session record, and remove it from JSON returned to browser JavaScript. Its cookie contains only the BFF handle. VPS/EDI remains responsible for customer identity and passkey ownership. The mock may use a private, random `mockSubjectKey` to group credentials across sessions; that is a test-store key, never a browser field or a proposed upstream account ID.

This is a new agreement that is **not yet represented in `api-spec-v2-draft.yaml`**. The draft still exposes `customerId` in `ResolvedVisitor` and does not define an EDI-session field on OTP verify or `/resolve`; it also defines a separate visitor `sessionId`. Update the contract before implementing the real adapter.

The installed package is `@simplewebauthn/browser@13.3.0` (lockfile); the requested server counterpart is `@simplewebauthn/server`, not a `simpleauth/server` package. Use a compatible 13.3.x server version for the mock, then upgrade browser and server together if desired.

## Current implementation findings

| Priority | Finding | Evidence | Consequence / plan |
| --- | --- | --- | --- |
| Critical | The browser uses the same literal `stub-challenge-value` for every ceremony and never sends attestation/assertion to a verifier. `startAuthentication()` resolving is treated as a successful login. | `apps/web/src/features/auth/hooks/use-auth-passkey.ts:62-93, 115-138` | Replace with server-generated, one-use challenge and server verification before any tier/session change. Current flow is a visual stub, not a working authentication system. |
| Critical | Passkey availability comes from `localStorage` credential IDs. Removing those IDs does not revoke a passkey; a synced credential may exist on another device. | `use-auth-passkey.ts:12-38`; `apps/web/src/features/demo-settings/components/demo-settings-form.tsx:159-161` | Drive account enrollment and management from `GET /auth/profile`; delete by server authentication-method ID. Remove localStorage as authority. |
| Critical | The UI raises T1 to T2 after **registration**. The VPS contract explicitly says registration leaves the tier unchanged, while passkey **login** raises it to T2. | `apps/web/src/features/auth/components/auth-flow.tsx:196-215`; `apps/web/src/features/auth/components/flows/passkey/use-passkey-flow.tsx:28-37`; `api-spec-v2-draft.yaml:721-728` | After enrollment return T1; if the requested gate needs T2, run an assertion ceremony before completing it. T2 must come from the verified BFF profile. |
| High | When passkey sign-in fails, `PasskeyFlow` falls through to the registration screen; registration can therefore start without a verified OTP session. | `apps/web/src/features/auth/components/flows/passkey/passkey.tsx:33-67`; EDI registration prerequisite at `edi_openapi_new.yaml:237-252` | Show retry / OTP fallback. Permit registration only with a server-verified T1 session. Treat user cancellation separately from technical failure. |
| High | Existing OTP mock accepts a fixed `000000` and returns only `verified: true`; it does not establish an EDI-like auth session. Start mock logs a random code that verify never accepts. | `apps/web/src/features/otp/bff/services/start-otp-mock.ts`; `verify-otp-mock.ts`; `apps/web/src/app/api/v1/auth/otp/verify/route.ts` | Make send/verify use the same code, then issue an opaque mock EDI session bound server-side to a private mock subject. The browser receives only the sanitized T1 profile. |
| High | Two OTP BFF routes/feature modules coexist: `/api/v1/auth/otp` (VPS shape) and `/api/v1/auth/otp/start` + `/verify` (current UI). The latter returns a smaller contract than VPS `PUT /auth/otp`. | `apps/web/src/config/routes/constants.ts`; `apps/web/src/features/auth/components/flows/otp/use-otp-flow.tsx`; `apps/web/src/app/api/v1/auth/otp/route.ts`; `api-spec-v2-draft.yaml:589-677` | Choose the VPS-shaped route as the target, adapt the UI service, and retire or explicitly alias the transitional endpoints. One mock session source must serve OTP and passkey. |
| High | Auth tiers and passkey metadata currently come from a writable demo-tier cookie and a hard-coded profile fixture. The server gate also reads that cookie. | `apps/web/src/features/profile/bff/use-cases/get-profile-tier.ts`; `apps/web/src/features/profile/bff/__fixtures__/profile-resolve-auth.fixture.ts`; `apps/web/src/features/auth/components/auth-gate.tsx` | Keep the demo tier switch isolated as a developer tool. The end-to-end demo must derive auth state from the mock BFF, and production authorization must use trusted VPS/EDI session state. |
| Medium | Passkey success component calls completion after a 3.5-second timer, in addition to the hook's registration completion callback. | `apps/web/src/features/auth/components/flows/passkey/passkey-created.tsx`; `use-passkey-flow.tsx` | Make completion exactly once after server confirmation. Keep any success animation independent of the security state transition. |
| Medium | `AuthPasskey.deviceBound` is described as derived from `authenticatorAttachment=platform`; platform attachment does not prove a credential is device-bound. `isThisDevice` is similarly an advisory UX hint for synced passkeys. | `api-spec-v2-draft.yaml:1001-1045`; [WebAuthn Level 3, attachment and backup flags](https://www.w3.org/TR/webauthn-3/) | Rename/clarify these fields upstream or treat them as labels only. Use backup-eligibility/state when the verifier actually supplies them. Do not use either field for authorization. |
| Medium | VPS defines per-passkey delete, but EDI marks `DELETE /passkeys/{authentication-method-id}` as planned and unimplemented. EDI list includes both primary passkeys and older Guardian MFA authenticators. | `api-spec-v2-draft.yaml:758-789`; `edi_openapi_new.yaml:707-899` | Demo per-item delete in mock. Gate live per-item deletion on EDI implementation; do not substitute clear-all. Keep primary passkeys distinct from Guardian MFA in UI and mapping. |
| High | The newly agreed EDI-session response field is absent from the checked-in VPS draft. `ResolvedVisitor.customerId` and `/merge` still assume an exposed customer ID, and the current BFF sets a profile-ID cookie from `customerId`. | `api-spec-v2-draft.yaml:81-135, 1342-1380`; `apps/web/src/features/profile/bff/services/profile-resolve-cookies.ts`; VPS team discussion | Ask VPS to revise OTP verify and `/resolve` schemas and clarify `/merge`; remove the profile-ID cookie dependency from auth. Do not build browser auth around `customerId`, `visitorId`, or the VPS visitor `sessionId`. |

## Contract and ownership map

| Browser → Next.js BFF (VPS-shaped) | BFF mock now | VPS → EDI later |
| --- | --- | --- |
| OTP verify, then `GET /api/v1/profile/resolve` on later page loads | Capture mock EDI-session value in BFF session store; return sanitized T1 profile | VPS supplies EDI session in a response field; BFF captures it and strips it from browser JSON |
| `POST /api/v1/auth/passkey` `{action:"register-options"}` | Require active T1 EDI-like session; generate registration options and `authSession` | VPS `POST /auth/passkey` → EDI `POST /passkeys/register` using the EDI continuity session; no account ID from FED |
| `PUT /api/v1/auth/passkey` `{action:"register", authSession, response}` | Verify registration; store public-key record; return refreshed auth profile at T1 | VPS `PUT /auth/passkey` → EDI `POST /passkeys/register/complete`; map `response` → `authnResponse` |
| `POST /api/v1/auth/passkey` `{action:"login-options"}` | Generate authentication options; no prior authenticated EDI session required | VPS → EDI `POST /passkeys/authenticate/start` |
| `PUT /api/v1/auth/passkey` `{action:"login", authSession, response}` | Resolve verified credential to private mock subject; issue a T2 mock EDI session | VPS → EDI `POST /passkeys/authenticate/complete`; EDI resolves identity and establishes T2 |
| `GET /api/v1/auth/profile` | Return T0/T1/T2 plus `metadata.auth.passkeys[]` from mock store | VPS `GET /auth/profile`, with EDI `GET /passkeys` behind it |
| `DELETE /api/v1/auth/passkey` `{authenticationMethodId}` | Authorize through current EDI-like session; remove one record; refresh list | VPS `DELETE /auth/passkey` → EDI per-item delete **when implemented** |

The VPS spec returns `{data, meta}` envelopes and expects `options`/`response`. EDI returns `authnParamsPublicKey` and expects `authnResponse`; these conversions belong only in the eventual VPS/EDI adapter. The BFF must not expose the new EDI-session field, Auth0 tokens, API keys, or internal trusted headers to browser JavaScript. VPS itself uses `X-Visitor-Id` and `X-Session-Id` for **visitor context**, not authenticated customer identity. The existing Next BFF already sets HttpOnly tracking cookies from `/profile/resolve` and should derive those headers server-side rather than accept client-provided identity headers. See `api-spec-v2-draft.yaml:1-38` and `apps/web/src/features/profile/bff/services/profile-resolve-cookies.ts`.

### Four identifiers with different jobs

| Value | Purpose | Lifetime / owner |
| --- | --- | --- |
| VPS `visitorId` + `sessionId` | Device/visitor profile context for VPS headers. Neither proves OTP or passkey authentication. | VPS `/resolve` may rotate `sessionId`; the existing BFF stores both in tracking cookies. |
| EDI session from OTP verify and `/resolve` | Opaque authentication continuity for T1/T2 and passkey ownership. This is the new VPS-team agreement. | VPS/EDI defines validity and rotation; the BFF keeps the value server-side behind its own opaque HttpOnly cookie. |
| BFF session handle | Random browser cookie that looks up the server-side EDI session; it does not reveal the EDI value. | Next.js BFF issues/rotates it and clears it on logout or expiry. |
| Passkey `authSession` | Correlation handle for **one** registration or authentication challenge. | Expires quickly and is consumed at ceremony completion; it is not a login session. |

`/resolve` must not create an authenticated EDI session from a fingerprint alone. Rehydrating T1/T2 must require a VPS-validated existing auth continuity signal. If a new browser can obtain another customer's EDI session merely by resolving a device fingerprint, the upstream contract needs a security change before integration.

WebAuthn registration options still contain an opaque `user.id` (the WebAuthn user handle), as shown in the EDI registration example in `edi_openapi_new.yaml`. The browser passes that value to the authenticator unchanged; it does not need a business account ID. EDI should generate/manage the production user handle. The mock should keep one stable, random WebAuthn user handle per private mock subject. Never use the EDI session as `user.id`: sessions expire and rotate, while a registered credential must remain associated with its user.

### Proposed production handoff

```mermaid
sequenceDiagram
    actor Shopper
    participant UI as Next.js UI
    participant BFF as Next.js BFF
    participant VPS as Visitor Profile Service
    participant EDI as EDI/Auth0 wrapper
    Shopper->>UI: Enter OTP
    UI->>BFF: PUT /api/v1/auth/otp
    BFF->>VPS: PUT /auth/otp with server-derived visitor context
    VPS->>EDI: Verify OTP
    EDI-->>VPS: Auth result / EDI continuity session
    VPS-->>BFF: T1 profile + EDI session response field
    BFF->>BFF: Store EDI value behind opaque BFF cookie handle
    BFF-->>UI: Sanitized T1 profile + HttpOnly BFF cookie
    UI->>BFF: GET /api/v1/profile/resolve on later load
    BFF->>VPS: POST /resolve with agreed continuity context
    VPS-->>BFF: Visitor profile + current EDI session field, if valid
    BFF->>BFF: Validate/refresh server record; remove EDI field
    BFF-->>UI: Sanitized visitor profile
```

The BFF should never call EDI directly; VPS decides how the EDI session reaches EDI's `edi-session-id` cookie. The arrow labeled “agreed continuity context” is deliberately pending the revised VPS contract. The BFF must not manufacture T1 from the returned tier alone if session continuity is unproven.

### VPS contract decisions needed before the real adapter

1. Exact EDI-session response-field name, expiry, rotation, and absence/null behavior on OTP verify, `/resolve`, and passkey login.
2. What authenticated proof lets `/resolve` return an existing EDI session? Device fingerprint and VPS visitor IDs alone are insufficient.
3. How should the BFF present the EDI session on later VPS passkey/profile requests, and how does VPS convert it into EDI's `edi-session-id` continuity cookie? This is not defined in the current draft.
4. Does VPS visitor `sessionId` rotation preserve the EDI auth session, and what does logout or OTP verification for a different user invalidate?
5. If `customerId` is no longer exposed, how does VPS perform `/merge` and maintain the existing `PROFILE_ID` cookie behavior? This must be a server-side VPS decision, not a FED identity claim.

## Demo state model

- `bffSessions`: random cookie handle → mock EDI-session value, private `mockSubjectKey` when authenticated, verified OTP time, current tier, expiry, and current visitor context. The cookie contains only the handle, with `HttpOnly`, `SameSite=Lax`, and `Secure` outside localhost. The EDI-session value is modeled separately from the VPS visitor `sessionId`.
- `mockSubjects`: normalized verified OTP contact (or a server-resolved contact token) → private random `mockSubjectKey` and stable random WebAuthn user handle. This is only a local way to make repeat OTP sign-ins reach the same demo credentials; never expose the subject key or treat it as a VPS/EDI account identifier. Passkey sign-in later finds the subject from the verified credential.
- `ceremonies`: random opaque passkey `authSession` → ceremony kind, challenge, BFF session and private subject binding for registration, created/expiry time, consumed flag. Expire and atomically consume each ceremony; reject replay, mismatched action, or another browser session using it.
- `credentials`: credential ID → private `mockSubjectKey`, public key, counter, transports, backup flags when available, server-generated management ID, label and timestamps. Do not store the private key. Key list and delete are scoped through the active mock EDI session to its private subject.
- `resolve` behavior: on OTP verify, mint a mock EDI session and bind it to the BFF handle. On later mock `/resolve`, return/refresh that same EDI session internally only when the BFF already presents valid auth continuity; otherwise return T0. On expiry, logout, or user switch, clear the BFF auth binding. Do not use fingerprint, `visitorId`, or VPS `sessionId` to recover T1/T2 by themselves.
- Use a module/global process singleton only in mock mode so local hot reload can retain state as far as the runtime permits; tests receive a resettable store. Reject enabling this store in production. Expect restart and multi-worker loss.

**WebAuthn policy for the mock:** a fixed configured RP ID and exact allowed origin(s), HTTPS in deployed environments (localhost for local development), a fresh cryptographic challenge per ceremony, discoverable credentials (`residentKey: "required"`) for passkey sign-in, and user verification enforced at verification. Use `@simplewebauthn/server` for option generation and both response verifiers; avoid hand-written CBOR or signature parsing. The verified credential ID, challenge, origin, RP ID hash, signature, private-subject binding, and one-time use determine success. Handle a zero or non-increasing signature counter per the library/spec rather than assuming every synced passkey increments it. [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/), [SimpleWebAuthn server 13.3.x](https://simplewebauthn.dev/docs/13.3.x/packages/server), [SimpleWebAuthn passkey guidance](https://simplewebauthn.dev/docs/advanced/passkeys).

## Sequence A: OTP → passkey enrollment

```mermaid
sequenceDiagram
    actor Shopper
    participant UI as Next.js UI
    participant BFF as Next.js BFF mock
    participant Device as Browser/passkey provider
    Shopper->>UI: Enter email/phone and OTP
    UI->>BFF: OTP start, then verify
    BFF->>BFF: Verify code; create private subject and mock EDI session (T1)
    BFF->>BFF: Store EDI session behind opaque BFF cookie handle
    BFF-->>UI: Auth profile T1 + HttpOnly BFF cookie (no EDI value in JSON)
    UI->>BFF: GET /profile/resolve after refresh
    BFF->>BFF: Validate BFF/EDI continuity; refresh sanitized profile
    BFF-->>UI: T1 profile, no EDI value in JSON
    Shopper->>UI: Choose Create passkey
    UI->>BFF: POST /auth/passkey register-options
    BFF->>BFF: Require T1 EDI session; bind challenge to BFF handle and private subject
    BFF-->>UI: options + authSession
    UI->>Device: startRegistration(optionsJSON)
    Device-->>UI: attestation response
    UI->>BFF: PUT /auth/passkey register + response
    BFF->>BFF: Verify challenge, origin, RP ID, UV; store public key
    BFF-->>UI: Auth profile T1, hasPasskey=true
```

The EDI registration completion example still reports OTP ACR; the VPS draft also states that registration does not raise the current session tier. If a gated action requires T2 immediately, perform Sequence B next. Do not infer T2 from passkey creation.

## Sequence B: passkey sign-in / step-up

```mermaid
sequenceDiagram
    actor Shopper
    participant UI as Next.js UI
    participant BFF as Next.js BFF mock
    participant Device as Browser/passkey provider
    Shopper->>UI: Choose Sign in with passkey
    UI->>BFF: POST /auth/passkey login-options
    BFF->>BFF: Save fresh challenge and authSession
    BFF-->>UI: options + authSession
    UI->>Device: startAuthentication(optionsJSON)
    Shopper->>Device: Unlock/select passkey
    Device-->>UI: assertion response
    UI->>BFF: PUT /auth/passkey login + response
    BFF->>BFF: Find credential; verify challenge, origin, RP ID, UV, signature
    BFF->>BFF: Map verified credential to private subject; issue T2 mock EDI session
    BFF-->>UI: Auth profile T2 + HttpOnly BFF cookie (no EDI value in JSON)
```

If no passkey is available, or the user cancels, offer OTP sign-in. Do not automatically turn an unsuccessful sign-in into registration. A blank/omitted `allowCredentials` supports discoverable passkey selection; the mock maps a **verified** credential to its private subject, while production EDI resolves customer identity internally. The fact that a credential exists in browser storage is never proof of authentication.

## Sequence C: list and delete

After OTP or passkey sign-in, `GET /auth/profile` returns passkey entries scoped by the active EDI session; no account ID is sent by the browser. Show label, created/last-used times, and a per-item Remove action. `DELETE /auth/passkey` accepts the **server management ID**, checks that the EDI session owns it and has suitable recent authentication, deletes one record, and refreshes the list. Deleted credentials may still appear in the device's password manager; explain that they can no longer sign in to this service. Decide with VPS whether deleting the passkey used for the current T2 session should revoke/downgrade that session; the current drafts do not specify this. Do not equate EDI's clear-all route with VPS single deletion.

## Ordered implementation plan (after review approval)

1. **Freeze the browser contract.** Add Zod schemas and route constants for the VPS-shaped passkey and auth-profile requests/responses, including discriminated register/login actions and WebAuthn JSON. Ask VPS to specify the EDI-session response field on OTP verify and `/resolve`, its expiry/rotation and null behavior, and how `/resolve` proves continuity without an account ID; remove or clarify `ResolvedVisitor.customerId` and the `/merge` requirement. Clarify upstream `deviceBound`, Guardian MFA filtering, and per-item delete readiness. This is a contract-only PR: schema examples and invalid-body tests pass without adding behavior.
2. **Deliver the mock BFF as five small PRs.** The table below is the recommended merge order. Each PR runs with `USE_AUTH_MOCKS`, remains disabled in production, and has its own route-level tests. Return the VPS `{data, meta}` envelope and defined errors from the first PR. Apply Zod validation, an opaque HttpOnly BFF cookie, and same-origin protection to every cookie-authenticated mutation as it is added. The BFF consumes the EDI-session response field internally and omits it from browser JSON.

   | PR | Scope | Individually testable result |
   | --- | --- | --- |
   | **BFF-1: OTP-backed EDI-session mock and profile** | Make OTP start/verify share one code. On success mint a mock EDI session bound to a private mock subject, capture it behind an HttpOnly BFF handle, and sanitize OTP and `/resolve` JSON. Add `GET /api/v1/auth/profile` returning T0/T1 and an empty passkey list. Keep old UI OTP endpoints as temporary aliases if needed. | OTP creates T1; `/resolve` preserves it only with valid continuity; a new browser/fingerprint alone stays T0. Invalid OTP, expired EDI session, and leaked EDI field tests fail safely. No passkey route is needed. |
   | **BFF-2: Registration options** | Add compatible `@simplewebauthn/server`, a short-lived one-use ceremony store, and `POST /api/v1/auth/passkey` for `register-options` only. Require the BFF-1 T1 EDI session; bind challenge to the BFF handle and private subject, returning `options` + passkey `authSession`. | Two requests produce distinct challenges; T0, malformed action, and expired EDI/BFF sessions are rejected. No browser credential is needed to test issuance. |
   | **BFF-3: Registration completion and list** | Add `PUT /api/v1/auth/passkey` for `register`, verify the attestation against stored challenge/origin/RP ID/user verification, and save the public-key credential under the private mock subject. Extend profile to list credentials scoped by the active EDI session. Leave the tier at T1. | A valid registration appears in profile; replay, wrong BFF session/private subject/origin/RP ID, and invalid response do not store a credential. Use a signed WebAuthn fixture or virtual authenticator for success. |
   | **BFF-4: Passkey sign-in** | Add `login-options` and `login` actions to POST/PUT. Issue a discoverable-credential challenge; map the **verified** credential ID to a private mock subject, verify assertion and counter policy, then mint a new T2 mock EDI session behind the BFF handle. | A registered credential signs in from a fresh session without an account ID; unknown/deleted credentials, wrong signature/origin/RP ID, expiry, and replay fail without T2. Test both route halves together. |
   | **BFF-5: Single passkey deletion** | Add `DELETE /api/v1/auth/passkey` using the server management ID, scope it through the active EDI-like session and suitable recent authentication, remove only that credential, and refresh profile. | Deleting one credential leaves others; another authenticated mock subject cannot delete it; the deleted credential cannot sign in. Device/password-manager copies may remain. |

   Keep memory-store modules replaceable so the later VPS adapter can preserve the same browser contract. A process restart resets this demo state; never enable this store in production or a multi-instance deployment.
3. **Connect the existing FED component in focused PRs.** First connect OTP/profile to the BFF-1 session, then replace `use-auth-passkey.ts` registration/localStorage stub using BFF-2/3, then connect sign-in using BFF-4. Use `startRegistration({optionsJSON})` and `startAuthentication({optionsJSON})` only with BFF options and send each response back for verification. Update `AuthFlow`/`PasskeyFlow` to take returned auth profile as authority, separate cancel/retry/OTP fallback/create states, and allow one completion callback. Registration stays T1; a verified assertion grants T2.
4. **Add management UI after BFF-5.** Replace the demo-settings localStorage reset with a server-backed list and per-item delete flow (or add a focused demo management screen). Include loading, empty, failure, and stale-item states; refresh `GET /auth/profile` after deletion. Do not promise OS/password-manager deletion.
5. **Verify the full demo.** Run the focused tests from each PR, then exercise OTP → create → sign out → passkey sign-in → list → delete → failed sign-in in a supported browser or Playwright virtual authenticator. Run lint and type-check. Avoid treating a mocked verifier alone as proof that a real ceremony works.
6. **Switch to VPS/EDI in a later PR.** Keep the FED contract unchanged; swap the mock adapter for VPS calls with server-derived visitor/session headers, trace propagation, timeouts, and response/error mapping. Capture the agreed EDI-session **response field** from OTP verify and `/resolve` into a durable server-side BFF session store (for example Redis), never pass that field to browser JavaScript, and use it for passkey registration/list/delete continuity. Confirm with VPS how it passes the value to EDI's `edi-session-id` continuity cookie, how it expires/rotates, and how passkey login replaces or upgrades it. Test against a sandbox before enabling per-item delete. Remove demo-only tier authority before any production use.

## Acceptance criteria for the future implementation

- A fresh browser can verify OTP, enroll a passkey, and see it in the server-backed list.
- A signed-out browser can sign in with that passkey; only successful **server verification** sets T2.
- A separately authenticated mock subject cannot list or delete another subject's passkeys; no account ID is present in browser passkey requests.
- A deleted passkey cannot authenticate; deleting one does not remove another.
- Replayed/expired challenges and malformed responses fail without changing session tier.
- OTP verify and `/resolve` EDI-session response fields never appear in browser JSON, logs, or readable cookies. A fresh browser or fingerprint alone cannot recover T1/T2.
- A browser refresh preserves the demo while the single server process lives; a process restart clearly resets mock state.
- The same frontend services work against the future VPS adapter without changing component-level WebAuthn orchestration.

## Jira breakdown for the mock BFF

Use **Mock passkey BFF for an end-to-end demo** as the parent item. Each row below is one independently testable story and PR; the FED connections can follow as separate stories.

| Story title | One-line description |
| --- | --- |
| Create OTP-backed EDI-session mock and auth profile | Capture a mock EDI session after verified OTP, preserve it through safe `/resolve` continuity, and return a sanitized T1 profile. |
| Add passkey registration options endpoint | Issue unique, expiring WebAuthn registration options only for a verified T1 account. |
| Verify passkey registration and list credentials | Verify the registration response, store the public key in memory, and list credentials scoped by the active EDI-like session while retaining T1. |
| Add verified passkey sign-in | Issue authentication options and grant T2 only after successful server-side assertion verification. |
| Add single passkey deletion | Delete one credential owned by the current EDI-like session's private subject and reject subsequent sign-in with it. |

## Sources checked for current standards and API behavior

- [W3C Web Authentication Level 3 Recommendation](https://www.w3.org/TR/webauthn-3/) — registration/assertion verification, RP ID and origin, backup flags, signature counters.
- [SimpleWebAuthn browser 13.3.x](https://simplewebauthn.dev/docs/13.3.x/packages/browser) and [server 13.3.x](https://simplewebauthn.dev/docs/13.3.x/packages/server) — APIs corresponding to the installed browser major.
- [Auth0 passkey APIs for embedded applications](https://auth0.com/docs/authenticate/database-connections/passkeys/passkey-apis) — enrollment after authentication and passkey login API shape. EDI/VPS remain the production intermediary for this project.
- [Auth0 OTP on database connections via API](https://auth0.com/docs/authenticate/database-connections/auth-api-passwordless-db-connections) — OTP session/token behavior relevant to the EDI wrapper.

**Review limit:** This was a static code/spec review. No application server, browser ceremony, or upstream endpoint was executed; the YAML files were read as text rather than validated by an OpenAPI parser.
