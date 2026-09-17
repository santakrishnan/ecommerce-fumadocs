# Passkey prompting: validation of the "detect and prompt" approach against published guidance

**Question asked:** for use case 2 (detect that the user has a passkey on their phone or tablet and prompt them to sign in with it) we adopted a layered approach: feature detection, immediate UI mode, conditional UI on the email field, a relying party hint cookie, then the OTP fallback. Is every layer an established, documented practice? Which parts are new browser features, and which parts are our own judgement?

**Answer:** every layer is documented by the browser vendors or by the FIDO Alliance, and the ordering matches what Google, FIDO and the leading passkey vendors recommend. Two layers are recent browser features (immediate UI mode, `getClientCapabilities()`), one is mature (conditional UI), and one is a product pattern rather than an API (the hint). Section 4 lists where our demo deviates from the guidance and what to change before it becomes product code. Every link was checked on 17 September 2026.

---

## 1. What we built

The sequence in `usePasskeyNudge` (`features/auth/hooks/use-passkey-nudge.ts`) and `features/auth/passkey/nudge.ts`:

| Step | What happens | Browser feature | Status |
| --- | --- | --- | --- |
| 0 | Read the `passkey-hint` cookie. If set, "Sign in with your passkey" becomes the primary button and OTP the secondary | none (first-party cookie set by the RP) | product pattern |
| 1 | `getClientCapabilities()` with fallbacks to the older `isConditionalMediationAvailable()` and `isUserVerifyingPlatformAuthenticatorAvailable()`; render the capabilities card | `PublicKeyCredential.getClientCapabilities()` | Baseline 2025 |
| 2 | Wait for a click or key press in the document | user activation requirement | required by Chrome for step 3 |
| 3 | If `immediateGet`: `navigator.credentials.get({ publicKey, uiMode: "immediate" })`. Sheet opens if a passkey exists; instant `NotAllowedError` if not | immediate UI mode | Chrome 149 only (September 2026) |
| 4 | If `conditionalGet`: arm `startAuthentication({ useBrowserAutofill: true })` on the email field marked `autocomplete="username webauthn"` | conditional UI (passkey autofill) | mature, all major browsers |
| 5 | Otherwise, or on rejection: the OTP form, unchanged | none | existing flow |
| always | The hybrid (QR) path lets a phone sign in for a desktop | `hybridTransport` capability | mature |

The same `login/options` and `login/verify` endpoints serve steps 3, 4 and the manual button; only the browser call differs. The rule "one pending WebAuthn request per tab" is enforced by cancelling before every ceremony.

---

## 2. Guidance that describes each layer

### 2.1 The overall shape: autofill first, button second, graceful fallback

**FIDO Alliance, required pattern "Sign in with a passkey"**
https://www.passkeycentral.org/design-guidelines/required-patterns/sign-in-with-a-passkey

One of only two required patterns in the FIDO design guidelines (the other is management in account settings, covered in the naming validation document). Its research found that "autofill ensured the highest success for people to sign in with a passkey" and that "using a dedicated Sign in with a passkey button is not as effective as autofill" because "many people do not discover a dedicated passkey button". It keeps the button as a secondary control for people who turned autofill off and for education, and requires "graceful fallback to other sign-in methods" including cross-device sign-in when the passkey is on another device. This is our layering: conditional UI on the field as the baseline, a button for the rest, OTP as the fallback, QR always available.

**passkeys.dev, "Bootstrapping"**
https://passkeys.dev/docs/use-cases/bootstrapping/

The FIDO-maintained developer reference for the sign-in flow. It specifies `autocomplete="username webauthn"` on the username field, `navigator.credentials.get()` with `mediation: "conditional"` when the page loads, and "If the call doesn't succeed, perform a 'legacy' user authentication". It also says that after a fallback or cross-device sign-in the site should "offer the user the choice to create a passkey on their local device", which is the natural next step after our OTP flow.

**Google for Developers, passkeys user journeys**
https://developers.google.com/identity/passkeys/ux/user-journeys

"It can be helpful to make use of the autofill feature in modern web browsers to bring passkeys to users", and for a separate button, "make sure it aligns cohesively with your aesthetic and identity". Also: "If you are unable to locate a user's passkey on a given device and the user signs in using a fallback sign-in method, consider prompting the user to create a new one."

### 2.2 Layer 4: conditional UI (passkey autofill)

**web.dev, "Sign in with a passkey through form autofill"**
https://web.dev/articles/passkey-form-autofill

Google's implementation guide: the `autocomplete="username webauthn"` attribute, `mediation: "conditional"`, feature detection, and the rule to use an `AbortController` because only one conditional request may be active. Support for the current API shape: Chrome 133, Edge 133, Firefox 135, Safari 17.4; earlier Chrome and Safari versions supported it under `isConditionalMediationAvailable()`.

**SimpleWebAuthn browser package**
https://simplewebauthn.dev/docs/packages/browser

`startAuthentication({ optionsJSON, useBrowserAutofill: true })` and `WebAuthnAbortService.cancelCeremony()`, which is what `armPasskeyAutofill()` and `cancelPasskeyAutofill()` call. The library requires an input with `autocomplete="webauthn"` to exist, which our `CreatePasskeyForm` provides.

**passkeys.dev device support**
https://passkeys.dev/device-support/

The matrix of "autofill UI" support per platform and browser, including iOS and iPadOS 16 onwards. This is the evidence that conditional UI is the right baseline for the client's iPhone and iPad question.

### 2.3 Layer 3: immediate UI mode

**Chrome for Developers, "Immediate UI mode for logins"**
https://developer.chrome.com/docs/identity/immediate-ui-mode

The reference for the newest layer. It defines the call (`uiMode: 'immediate'`, `publicKey` with an empty `allowCredentials`, optional `password: true`), the feature check (`getClientCapabilities().immediateGet`), the behaviour with no credentials ("throws a `NotAllowedError`" promptly, with no dialog), the rule that "this call must follow a user gesture, like a button click", the privacy safeguards (incognito always rejects; non-empty `allowCredentials` rejects; the dialog cannot be dismissed with `signal`), and the availability: "As of May 2026, Chrome is the only browser that supports immediate UI mode." Our `signInWithPasskeyImmediate()` follows this page, and our fallback to conditional UI covers every other browser.

**Chrome for Developers, "Streamlined sign-in: Immediate UI mode is now available"** (May 2026)
https://developer.chrome.com/blog/webauthn-immediate-ui

The Chrome 149 launch post. It states that the origin-trial spelling `mediation: 'immediate'` no longer triggers the feature, which is why our code uses `uiMode`.

**Chrome for Developers, origin trial announcement** (August 2025)
https://developer.chrome.com/blog/webauthn-immediate-mediation-ot

Historical context: Chrome 139 to 141 trial. Explains why older articles and library issues still say "immediate mediation"; the behaviour is the same, the spelling changed.

**WebKit release notes, Safari 26.0 to 26.6**
https://webkit.org/blog/17333/webkit-features-in-safari-26-0/

Checked to confirm the Safari position: Safari 26.0 added the Signal API and none of the 26.x notes mention immediate UI mode. On iPhone the immediate layer is skipped by feature detection and conditional UI carries the experience, which is what the FIDO research says works best anyway.

### 2.4 Layer 1: feature detection

**web.dev, "Simpler WebAuthn feature detection"**
https://web.dev/articles/webauthn-client-capabilities

**Chrome for Developers, "Simplifying WebAuthn feature detection for passkeys"**
https://developer.chrome.com/blog/passkeys-client-capabilities

**MDN, `PublicKeyCredential.getClientCapabilities()`**
https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/getClientCapabilities_static

One call returns `conditionalGet`, `immediateGet`, `hybridTransport`, `passkeyPlatformAuthenticator`, `userVerifyingPlatformAuthenticator` and the signal capabilities. Chrome 133, Edge 133, Firefox 135, Safari 17.4; Baseline 2025. The Chrome passkey management guide adds a practical rule we follow: keep the older `isConditionalMediationAvailable()` and `isUserVerifyingPlatformAuthenticatorAvailable()` as fallbacks for browsers that predate it. Our capabilities card on the demo is this call rendered, so the client can see what their own device supports.

### 2.5 Layer 0: the relying party hint

There is no browser API for "does this device have a passkey"; the vendors are explicit that this is by design (see the privacy sections of the immediate UI mode page and the conditional UI article). What exists instead is inference from the site's own history, and that is a documented industry pattern:

**Corbado, "How to get high passkey adoption in login flows"**
https://www.corbado.com/blog/passkey-login-best-practices

Describes the same three techniques we use (conditional UI, a passkey button, and a prediction layer) and calls the third "Passkey Intelligence": "a dynamic layer that predicts whether a user's passkey is likely available on the current device or environment" using "Device & Browser Data" and "User History: Past successful passkey logins, fallback usage, skip patterns for this environment and device", used to "auto-trigger a passkey login" or "revert gracefully to fallback flows". Our `passkey-hint` cookie is the minimal version of this: set when a platform passkey was created or used from this browser, read to decide which button is primary. The signal we use (`authenticatorAttachment === "platform"` on the verified response) is the one the vendors use for the same purpose.

**web.dev, "Create a passkey for passwordless logins"**
https://web.dev/articles/passkey-registration

Lists the backup eligibility flag and the attachment as data the server should keep after registration, which is the data the hint is derived from.

### 2.6 The one-request-per-tab rule and the user gesture

**web.dev, passkey form autofill** (above): only one conditional WebAuthn call may be active; cancel with `AbortController` before another ceremony.

**Chrome, immediate UI mode** (above): the call must follow a user gesture and does not consume the activation.

Both rules shaped the demo: `cancelPending()` before every ceremony in `client.ts`, and the nudge waiting for a click before running layers 3 and 4. The first rule also explains the "A request is already pending" error the docs page produced when several previews shared a tab.

### 2.7 Cross-device (QR) path

**FIDO required pattern** (2.1): "If they have a passkey available on another device, they can use cross-device sign-in to sign in."
**passkeys.dev device support** (2.2): the "cross-device authentication" column.

The hybrid transport is what makes "no passkey on this device" a non-blocking state, and `hybridTransport` in the capabilities card shows whether it is available.

---

## 3. Point-by-point validation

| Our decision | Backed by | Verdict |
| --- | --- | --- |
| Conditional UI on the email field is the baseline | FIDO required pattern 2.1, passkeys.dev 2.1, web.dev 2.2 | Standard practice; the research-backed default |
| `autocomplete="username webauthn"` on the existing email input | passkeys.dev 2.1, web.dev 2.2 | Standard practice |
| Immediate UI mode as the first layer where supported | Chrome docs 2.3 | Documented and shipped in Chrome 149; correct to feature-detect and fall through |
| `uiMode: "immediate"` rather than `mediation: "immediate"` | Chrome launch post 2.3 | Required since Chrome 149 |
| Wait for a user gesture before the immediate call | Chrome docs 2.3 | Required |
| Feature detection with `getClientCapabilities()` plus legacy fallbacks | 2.4, Chrome management guide | Standard practice |
| Cancel the pending request before any other ceremony | web.dev 2.2, SimpleWebAuthn 2.2 | Required |
| Hint cookie to promote the passkey button for returning users | Corbado 2.5; no vendor API exists by design | Established vendor pattern; ours is the minimal form |
| Hint set only on `authenticatorAttachment === "platform"` | web.dev 2.5 (attachment is response data to keep) | Reasonable; see gap 3 |
| OTP as the fallback, unchanged | FIDO 2.1, passkeys.dev 2.1, Google 2.1 | Standard practice |
| QR path always available | FIDO 2.1 | Standard practice |
| Offer passkey creation after an OTP sign-in (planned, not built) | passkeys.dev 2.1, Google 2.1 | Standard practice; next step |

Nothing here is untested. The immediate layer is the only part younger than a year, and it is a shipped Chrome feature with reference documentation, guarded by feature detection so no other browser sees it.

---

## 4. Where the demo deviates from the guidance, for the team to decide

1. **Trigger for the immediate call.** Chrome's example ties immediate UI mode to a sign-in button click. The demo starts it on any click or key press inside the preview, which is a convenience for the docs page. In the product, the trigger should be the user's real intent: tapping "Sign in", or the `GuardedLink` tap that opens the auth overlay. That also avoids surprising the user with a sheet when they only clicked somewhere on the page.
2. **Button versus autofill priority.** The FIDO research favours autofill over a button. Our hint layer promotes a "Sign in with your passkey" button to primary when the cookie is set. That is consistent with the FIDO note that a button helps "when multiple sign-in methods appear together" (we have OTP alongside), but it should stay secondary when the hint is absent, as it does now.
3. **The hint is narrower than it could be.** We set it only for platform authenticators. A user who signs in with a synced passkey through the QR path from their phone will not get the hint on the laptop, which is correct (the passkey is not on the laptop), but a user of a third-party manager such as 1Password does register as `platform`, so they do get it. That is fine. Corbado's version also records skips and fallbacks so a user who keeps dismissing the prompt stops being prompted; ours has no such decay. Worth adding a "dismissed" state if the client cares about prompt fatigue.
4. **Hint cookie versus server-side flag.** The cookie is per browser, which is the right scope, but it is a client-readable cookie that a stale browser could carry after the passkey was deleted. The effect of a wrong hint is one failed prompt and a fall-through to OTP, so the risk is UX only. The BED could instead return `hasPlatformPasskeyFromThisBrowser` from the session endpoint if the team prefers no client-readable cookies.
5. **Conditional UI timing and challenge TTL.** The mock's 5-minute challenge expiry can cut a long-idle conditional request; the guidance has no fixed number. The product should either use a longer TTL for conditional requests or re-arm on expiry.
6. **Passkey creation after OTP.** Both Google and passkeys.dev recommend offering to create a passkey right after a fallback sign-in. This is the missing link between the OTP flow and passkeys and is the next feature to build. Chrome's conditional create (`mediation: "conditional"` on `create()`, https://developer.chrome.com/docs/identity/webauthn-conditional-create) is the silent version, but it requires a password autofill event and does not apply to an OTP flow, so the explicit "Create a passkey?" prompt is the fit here.
7. **Firefox and the Signal API.** Not a prompting concern, but the same capability call tells us Firefox has no Signal API; revoke still works there, the password manager just keeps the stale entry.

---

## 5. One-paragraph summary for the client

The prompting approach follows the FIDO Alliance's required "Sign in with a passkey" pattern and Google's implementation guidance: passkey autofill on the email field is the baseline because FIDO's research shows it has the highest success rate, a "Sign in with your passkey" button is promoted for browsers that have used a passkey here before, Chrome's new immediate UI mode opens the passkey sheet directly on the first tap where the browser supports it, and every layer is feature-detected so an unsupported browser falls through silently to the existing OTP flow. No layer depends on undocumented behaviour, and the one thing that cannot be done (asking the browser whether a passkey exists) is not attempted, because the browsers block it on purpose.
