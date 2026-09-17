# Passkey naming: validation of the approach against published guidance

**Question asked:** the "Your passkeys" list names each passkey from the AAGUID, falls back to the browser and OS from the user agent, and lets the user rename through `PATCH /passkeys/:id`. Is this an established pattern, or did we invent something?

**Answer:** it is the established pattern. Google's own passkey guidance describes the same three-part approach in the same order, and the two largest passkey deployments visible to users (Google accounts, GitHub) show the same information. Every link below was checked on 17 September 2026. Where our implementation differs from the guidance, the difference is listed in section 4 so the team can decide.

---

## 1. What we built

| Element | Our implementation | File |
| --- | --- | --- |
| Provider name from AAGUID | Look up the AAGUID reported at registration in a vendored copy of the community list; "Not disclosed" for all-zero | `mock-server/label.ts`, `aaguids.json` |
| Device context from the user agent | "Safari on iPhone", "Chrome on Mac", captured once at registration | `mock-server/label.ts` `platformLabelFor()` |
| Default label | `<authenticatorName> · <platformLabel> · added <date>`, falling back to `Passkey · added <date>` | `displayNameFor()` |
| User nickname | `PATCH /passkeys/:id { nickname }`; when set it replaces the default label | `server.ts` `renamePasskey()` |
| Synced or device-bound badge | From `credentialBackedUp` and `credentialDeviceType` | `summarize()` |
| Created and last used | `createdAt`, `lastUsedAt` | store |
| Delete | `DELETE /passkeys/:id`, then Signal API `allAcceptedCredentials` with the remaining IDs | `client.ts` `revokePasskey()` |

---

## 2. Published guidance that describes the same approach

### 2.1 Google Chrome team: "Passkey Management" guide (the closest match)

https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/security/passkey-management.md

This is the Chrome team's implementation guide for a passkey management page. It prescribes, as requirements:

- Server endpoints to list credentials for the signed-in user, update a credential's name, and delete a credential, with an ownership check that returns 404 when the credential belongs to another user. Our `GET`, `PATCH` and `DELETE /passkeys` are these three endpoints with the same check.
- Per row: provider icon (AAGUID-derived), provider name or the user's custom name, registration date, last used date, a rename button and a delete button. Our `PasskeyCredentialSummary` carries every one of those fields; the demo card shows all but the icon.
- On the AAGUID: "A community-maintained JSON mapping of AAGUIDs to provider names and icons is available at" the `passkeydeveloper/passkey-authenticator-aaguids` file. That is the list we vendored.
- On the all-zero AAGUID: "check if it equals `'00000000-0000-0000-0000-000000000000'`. If so, skip the registry lookup and set `name` to a fallback (e.g. device name from user-agent, or 'Unknown passkey provider')". That sentence is the user agent fallback we implemented.
- On limits: "AAGUID should only be used to help users with passkey management. It can be modified unless cryptographically attested, which platform passkeys currently don't support." This matches our decision to use it for labels only and to keep `attestation: "none"`.
- After delete: call `signalAllAcceptedCredentials()` with the updated list. That is what `revokePasskey()` does with `remainingIds`.

### 2.2 web.dev: "Create a passkey for passwordless logins"

https://web.dev/articles/passkey-registration

Google's registration walkthrough lists what the server should store per credential and says of the credential name: "Name it after the passkey provider it's created by which can be identified based on the AAGUID". It also lists the AAGUID ("a unique identifier of the passkey provider"), the backup eligibility flag ("true if the device is eligible for passkey synchronization"), and transports as fields to keep, and describes `excludeCredentials` as preventing "registering the same device twice". Our store holds exactly those fields and our registration options populate `excludeCredentials` the same way.

### 2.3 Google for Developers: passkey UX guidance

User interface design: https://developers.google.com/identity/passkeys/ux/user-interface-design
User journeys: https://developers.google.com/identity/passkeys/ux/user-journeys

The UI page recommends one card per passkey in account settings: "Inside the card include the passkey icon, information about the passkey such as when and which ecosystem it was created on, when was it last used, and options for managing the passkey." The journeys page adds: "Clearly show the source of each passkey (sometimes referred to as 'provenance' in this context), whether it is Google Password Manager, iCloud Keychain, Windows Hello, or a third-party password manager", and "If a user creates more than one passkey on devices from the same ecosystem, add numbers to additional passkeys so the user can distinguish them." It also recommends the word "delete" rather than "revoke" in the UI.

"Which ecosystem" is the AAGUID name. "When it was created" and "last used" are our timestamps. "Add numbers" is a variation of our approach: we distinguish two passkeys from the same ecosystem by the platform label and date rather than by a number; see section 4.

### 2.4 FIDO Alliance design guidelines (Passkey Central)

Design guidelines: https://www.passkeycentral.org/design-guidelines
Management UI pattern: https://www.passkeycentral.org/design-guidelines/optional-patterns/passkey-management-ui-best-practices-for-combining-all-passkey-types

The FIDO UX working group's patterns (research across 32 companies) include "Passkey Management UI" and "Remove Passkeys from Service Provider Account Settings" as recognised patterns. The management pattern groups passkeys into "Passkeys on your devices" and "Passkeys on security keys" and notes the practice of prompting the user to name a security key after enrolment, which is the nickname idea for the hardware key case. It does not prescribe field-level content; the Google guides above do.

### 2.5 Community AAGUID list

https://github.com/passkeydeveloper/passkey-authenticator-aaguids

The list is maintained by the passkey providers themselves through pull requests and is the source the Chrome guide points to. Its README is explicit that it complements, and does not replace, the FIDO Metadata Service. It ships names and light and dark icons; we use the names and could add the icons.

### 2.6 SimpleWebAuthn server documentation

https://simplewebauthn.dev/docs/packages/server

`verifyRegistrationResponse()` returns `registrationInfo` with `aaguid`, `credential.transports`, `credentialDeviceType` (`singleDevice` or `multiDevice`) and `credentialBackedUp`, and the docs recommend storing them. Our synced or device-bound badge is a direct reading of those two flags. The library exposing the AAGUID as a first-class result is itself a signal that reading it for labelling is expected use.

### 2.7 Products doing the same thing

- GitHub account settings list passkeys by name with a "Synced" label next to synced ones and a delete action per row: https://docs.github.com/en/authentication/authenticating-with-a-passkey/managing-your-passkeys. Our `type: "synced" | "device-bound"` badge is the same distinction.
- Google account "Passkeys and security keys" shows the provider or device name, creation date and last-used date per passkey, with rename and delete, following the guidance in 2.3.

---

## 3. Point-by-point validation

| Our decision | Backed by | Verdict |
| --- | --- | --- |
| Name from AAGUID via the community list | Chrome passkey-management guide 2.1, web.dev 2.2, Google UX 2.3 | Standard practice; the same list is the one Google's guide names |
| All-zero AAGUID shown as "Not disclosed" and never looked up | Chrome guide 2.1 (explicit zero check before lookup) | Standard practice |
| User agent as the fallback and as extra context | Chrome guide 2.1 ("device name from user-agent") | Standard practice as a fallback. Using it alongside the AAGUID name, not only as a fallback, is our addition; it is harmless and is how Google's own account page reads ("Chrome on Mac") |
| Label computed and stored at registration, not at display time | Chrome guide 2.1 (`name` set in the registration handler) | Standard practice |
| Nickname via `PATCH`, replacing the default | Chrome guide 2.1 (rename endpoint and button), FIDO pattern 2.4 (name a security key) | Standard practice |
| `createdAt`, `lastUsedAt` on the card | Chrome guide 2.1, Google UX 2.3 | Standard practice |
| Synced vs device-bound badge from `credentialBackedUp` | SimpleWebAuthn 2.6, GitHub 2.7, web.dev 2.2 | Standard practice |
| Delete then `signalAllAcceptedCredentials(remainingIds)` | Chrome guide 2.1 | Standard practice |
| AAGUID used only for labels, `attestation: "none"` kept | Chrome guide 2.1 ("should only be used to help users with passkey management") | Standard practice |
| Ownership check returning 404 on rename and delete | Chrome guide 2.1 (identical code shape) | Standard practice |

Nothing in the list is novel. The only choices that are ours rather than copied are formatting choices: the middle-dot label format, showing the platform label next to the provider name instead of only as a fallback, and using platform plus date instead of a running number to tell same-ecosystem passkeys apart.

---

## 4. Gaps against the guidance, for the team to decide

1. **Provider icon.** The Chrome guide lists the icon as required per row and the community list ships light and dark SVGs. We store the name only. Adding the icon means vendoring `combined_aaguid.json` instead of `aaguid.json` and rendering a data URI on `StoredPasskeyCard`. Small change, worth doing before the client sees the list.
2. **Signal on page load.** The Chrome guide says to call `signalAllAcceptedCredentials()` when the management page loads, not only after a delete, so a passkey deleted from another device or by support is hidden the next time the user visits. We only signal after delete and reset. One call in `PasskeyList` on mount fixes it.
3. **Signal after a profile rename.** If the user changes their display name or email, `signalCurrentUserDetails()` updates what the password manager shows next to the passkey. Not relevant to the passkey nickname (that lives on our server only), but relevant when the profile feature lands.
4. **Numbering duplicates.** Google suggests "iCloud Keychain 2" style numbering for a second passkey from the same ecosystem. Our label carries platform and date instead, which distinguishes them in practice; if the client prefers numbering, it is a change in `displayNameFor()` only.
5. **Wording.** Google recommends "Delete" rather than "Revoke" in the UI. The demo uses "Revoke" on the button; the endpoint name can stay, the label should change.
6. **User agent parsing is approximate.** The guidance accepts it as a fallback, not as a source of truth. Our label says "Chrome on Mac" for a Chrome-profile passkey, which is right, but a synced passkey created in Safari on iPhone will still read "Safari on iPhone" when used from a Mac. The AAGUID name is the stable part; the platform label describes where it was created, and the card copy should say "added from", not "on".

---

## 5. One-paragraph summary for the client

The naming approach follows Google's published passkey management guidance: identify the provider from the AAGUID using the community-maintained list that Google's guide itself references, fall back to the browser and device from the user agent when the provider does not disclose an AAGUID, show creation and last-used dates, and let the user rename or delete. The same information is what Google and GitHub show on their own passkey settings pages. No part of it depends on undocumented behaviour, and the AAGUID is used for labelling only, never for security decisions, as the guidance requires.
