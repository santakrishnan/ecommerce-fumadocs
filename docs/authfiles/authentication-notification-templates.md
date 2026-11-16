# Authentication Notification Templates – Auth0 and Ecommerce

Nov 16, 2026

## Summary

Auth0 only sends the messages that deliver a code or link (the OTP email and SMS, verification, blocked account); it sends **no security notifications** for passkeys, contact changes, new devices or profile changes. All nine ecommerce templates in the story, plus six more we recommend, therefore need to be sent by EDI or our own notification service, triggered by EDI API calls or Auth0 log and event data.

- **Auth0 templates our OTP + passkey setup uses:** the passwordless OTP email, the passwordless SMS message, and (if brute-force protection is on) the blocked-account email. Welcome and verification emails apply only if the database connection is configured for them.
- **Auth0 templates we don't need:** password change, password breach, MFA (Guardian) enrollment and user invitation, because we have no passwords, no Guardian MFA and no Organizations.
- **Template catalogue:** the two-column table below covers all 9 story templates (passkey removal split into single and all), the 3 Auth0 templates we use, and 6 additions, each with a sample body for review with Andy Baldwin.
- **Requirements file:** the linked `requirements-notifications.md` is in a private GitHub repo this session can't open, so the catalogue should be checked against it in the review.

## What Auth0 provides out of the box

Auth0 has 11 email templates, a passwordless SMS message, and 5 phone (SMS / voice) templates. All are editable with Liquid syntax, but custom email templates only work with an external email provider: Auth0's built-in provider "does not support production use" and can't use custom templates ([Auth0](https://auth0.com/docs/customize/email/smtp-email-providers)).

### Email templates

| Auth0 template | When Auth0 sends it | What the message contains | Template-specific variables | Relevant to us? | Auth0 reference |
| --- | --- | --- | --- | --- | --- |
| Passwordless OTP email | Every time a customer asks for a sign-in code by email (`/passwordless/start` with the email connection). Each new request cancels the previous code | The one-time code (or a magic link, if the connection uses links) | `code`, `link`, `send` (`code` / `link`), `operation`; only `user.email` from the profile | **Yes** — our email OTP. Edited on the Passwordless email connection, not on the Email Templates page | [Email OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-otp) |
| Verification code email | Only if code-based email verification is turned on: at a customer's first sign-up or login. Also when Adaptive MFA flags a low-confidence sign-in and asks the customer to prove they own the email | A code to enter during sign-in | `code` | Only if the connection is set to verify email | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| Verification link email | At a customer's first sign-up or login, when email verification by link is used | A link that marks the email as verified | `url` | Only if the connection is set to verify email | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| Welcome email | If enabled: once the customer verifies their email. If verification isn't used: at first sign-up or login | Informational welcome text, no code or link | — | Possible carrier for "First time registered" (email customers only) | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| Blocked account email | Only if brute-force protection is on with "Send notifications to the affected users": when failed sign-ins from one IP to one account reach the threshold (default 10, settable 1–100). At most 1 an hour per IP | Where the attempts came from, and a link to unblock (automatic on opening, or a button if "Manual" is chosen) | `user.source_ip`, `user.city`, `user.country`, `url` | **Yes**, if brute-force protection is on | [Brute-force protection](https://auth0.com/docs/secure/attack-protection/brute-force-protection) |
| Change password code email | A user with a password asks to reset it (code flow) | A code plus a link to the reset page | `code` | No — no passwords | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| Change password link email | A user with a password asks to reset it (link flow) | A link to the reset page | `url` | No — no passwords | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| Password breach alert email | A user signs in with a password Auth0 knows has leaked elsewhere (breached password detection) | A warning, no code | — | No — no passwords | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| MFA enrollment email | An administrator sends a Guardian MFA enrollment invite | A link to enroll in MFA | `link` (no `connection.name`) | No — no Guardian MFA | [Auth0 Guardian](https://auth0.com/docs/secure/multi-factor-authentication/auth0-guardian) |
| MFA verification code email | A user with email set up as an MFA factor signs in and needs the second-factor code | An MFA code | `code` | No, unless email MFA is enabled | [Email templates](https://auth0.com/docs/customize/email/email-templates) |
| User invitation email | Someone is invited to an Auth0 Organization or application | A link to join | `inviter.name`, `roles` | No — no Organizations | [Email templates](https://auth0.com/docs/customize/email/email-templates) |

Common variables in every email template include `application.name`, `user.email`, `user.name`, `user.given_name`, `user.user_metadata`, `friendly_name`, `support_email`, `support_url` and `request_language` ([Auth0 variables](https://auth0.com/docs/customize/email/email-templates/use-liquid-syntax-in-email-templates)).

### SMS and voice

| Auth0 template | When Auth0 sends it | What the message contains | Variables | Relevant to us? | Auth0 reference |
| --- | --- | --- | --- | --- | --- |
| Passwordless SMS message | Every time a customer asks for a sign-in code by SMS (`/passwordless/start` with the SMS connection). Each new request cancels the previous code | The one-time code | `@@password@@` / `code`, `phone_number`, `application.name`, `request_language` | **Yes** — our SMS OTP. Edited in the Message field of the Passwordless SMS connection | [SMS OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/sms-otp) |
| Phone template `otp_enroll` | Only with phone-based MFA: when a customer first enrolls a phone number as a second factor | An enrollment code, by SMS or voice | `code`, `message_type`, `locale`, `tenant.friendlyName` | Only if EDI uses Auth0 phone MFA | [Customize SMS or voice messages](https://auth0.com/docs/customize/customize-sms-or-voice-messages) · [Unified phone experience](https://auth0.com/docs/customize/phone-messages/unified-phone/use-auth0s-unified-phone-experience-for-multi-factor-authentication) |
| Phone template `otp_verify` | Only with phone-based MFA: each later sign-in that asks for the phone factor | A verification code, by SMS or voice | Same as `otp_enroll` | Only if EDI uses Auth0 phone MFA | Same as above |
| Phone template `blocked_account` | Brute-force protection blocks an account whose user signs in with a phone identifier (instead of the email). At most 1 an hour per identifier | A notice that sign-in is blocked | — | Possibly, for phone-only customers | [Brute-force protection](https://auth0.com/docs/secure/attack-protection/brute-force-protection) |
| Phone template `change_password` | A user with a password and a phone identifier asks to reset it | A reset code | — | No — no passwords | [Phone templates API](https://auth0.com/docs/api/management/v2/branding/create-phone-template) |
| Phone template `password_breach` | A phone-identifier user signs in with a leaked password | A warning | — | No — no passwords | [Phone templates API](https://auth0.com/docs/api/management/v2/branding/create-phone-template) |

The five phone templates are managed through the Branding phone-template API ([Auth0 API](https://auth0.com/docs/api/management/v2/branding/create-phone-template)); MFA SMS and voice text is described in [Customize SMS or voice messages](https://auth0.com/docs/customize/customize-sms-or-voice-messages).

### What Auth0 does not send

No template exists for passkey enrolled or removed, contact channel added or removed, sign-in identifier changed, new device, account recovery or name change. Auth0 only **records** some of these, which we can use as triggers:

| Auth0 signal | Meaning | Source |
| --- | --- | --- |
| Log `ss` | Signed up; `details.authentication_methods` includes `passkey` | [Passkey events in tenant logs](https://auth0.com/docs/authenticate/database-connections/passkeys/monitor-passkey-events-in-tenant-logs) |
| Log `s` | Signed in; `performed_amr` = `phr` for a passkey | Same |
| Log `gd_enrollment_complete` | Passkey enrolled (progressive or local enrollment) | Same |
| Log `gd_webauthn_enrollment_failed` | Passkey enrollment failed | Same |
| Event Streams (`com.auth0.user.*`) | User created / updated / deleted, pushed to a webhook | [Event Streams](https://auth0.com/docs/customize/events/create-an-event-stream) |

## How our OTP and passkey setup maps onto Auth0

In our design, EDI calls Auth0's passwordless OTP (email and SMS) and the Native Passkeys API, so Auth0 delivers the OTP codes and nothing else that the shopper reads. Five Auth0 settings decide whether those code messages are correct and on-brand:

| Auth0 setting | What we need | Where |
| --- | --- | --- |
| Passwordless email connection → email template | Our body (below); says the code expires in **60 seconds** (EDI's expiry) | [Email OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-otp) |
| Passwordless SMS connection → Message | Short body with `@@password@@` and the 60-second expiry | [SMS OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/sms-otp) |
| External email provider | Required for custom templates and production volume (built-in: 10 emails a minute, no custom templates) | [Email providers](https://auth0.com/docs/customize/email/smtp-email-providers) |
| SMS / phone provider | Our sender ID and region for SMS | Passwordless SMS connection or phone provider settings |
| Brute-force protection | If on, the blocked-account email (and `blocked_account` phone template) needs our wording | [Email templates](https://auth0.com/docs/customize/email/email-templates) |

Three limits shape the templates:

- **The passwordless OTP email can only use `user.email` from the profile**, not the shopper's name. A "Hi Alex" greeting is impossible in that one template.
- **Passkeys enrolled through the Native Passkeys API** go through EDI's own calls. Whether Auth0 still writes the `gd_enrollment_complete` log for them is unconfirmed, so the reliable trigger for "passkey enrolled" is EDI's register-complete call.
- **Nothing in Auth0 sends after the fact.** Every security notice (the ecommerce list) has to be sent by EDI or our notification service.

## Template catalogue

Every template below is a sample for review. Placeholders are in `{{ }}`: `{{brand}}` (the brand name, to confirm), `{{first_name}}`, `{{masked_contact}}` (e.g. `•••-•••-7023` or `s•••@gmail.com`), `{{device}}` (e.g. "Chrome on Mac"), `{{location}}` (approximate city), `{{time}}`, `{{security_url}}` (account security page) and `{{support_url}}`. Security notices never contain a code or a sign-in link, so a forwarded or phished message can't be used to take over the account.

| Template name | Template body |
| --- | --- |
| **Sign-in code – email** (Auth0 Passwordless OTP email) | Subject: Your {{brand}} sign-in code. — Your sign-in code is **{{code}}**. It expires in 60 seconds. Don't share this code with anyone; {{brand}} will never ask you for it. If you didn't try to sign in, you can ignore this email. |
| **Sign-in code – SMS** (Auth0 Passwordless SMS) | {{brand}}: Your code is @@password@@. Expires in 60 seconds. Never share it. |
| **Account temporarily blocked** (Auth0 Blocked account email) | Subject: We've paused sign-in to your {{brand}} account. — We noticed several unsuccessful sign-in attempts from {{location}} and paused sign-in to keep your account safe. If this was you, use the link below to unblock your account. If it wasn't, you don't need to do anything; your account is protected. \[Unblock my account\] |
| **First time registered** | Subject: Welcome to {{brand}}. — Hi {{first\_name}}, your {{brand}} account is ready. You signed up with {{masked\_contact}}. Next time, you can sign in with a one-time code, or set up a passkey to sign in with Face ID, fingerprint or your device PIN. Manage your sign-in options at {{security\_url}}. |
| **Contact channel added** | Subject: A new {{channel\_type}} was added to your account. — Hi {{first\_name}}, {{masked\_new\_contact}} was added to your {{brand}} account on {{time}} from {{device}}. If you made this change, no action is needed. If you didn't, review your account at {{security\_url}} or contact us at {{support\_url}}. *(Sent to the existing primary contact, not only the new one.)* |
| **Contact channel removed** | Subject: A {{channel\_type}} was removed from your account. — Hi {{first\_name}}, {{masked\_removed\_contact}} was removed from your {{brand}} account on {{time}} from {{device}}. You'll no longer receive codes or messages there. If you didn't make this change, contact us right away at {{support\_url}}. *(Sent to the removed contact and to the primary contact.)* |
| **Primary sign-in identifier changed** | Subject: Your {{brand}} sign-in {{channel\_type}} has changed. — Hi {{first\_name}}, your sign-in {{channel\_type}} was changed from {{masked\_old\_contact}} to {{masked\_new\_contact}} on {{time}} from {{device}}. From now on, sign-in codes go to the new {{channel\_type}}. If you didn't make this change, contact us immediately at {{support\_url}}. *(Sent to both old and new; the copy to the old one is the important security alert.)* |
| **Passkey enrolled** | Subject: A passkey was added to your {{brand}} account. — Hi {{first\_name}}, you can now sign in with a passkey saved in {{passkey\_provider}} on {{device}}, created on {{time}}. If you didn't add this passkey, remove it at {{security\_url}} and contact us. |
| **Passkey removed (single)** | Subject: A passkey was removed from your account. — Hi {{first\_name}}, the passkey "{{passkey\_label}}" was removed from your {{brand}} account on {{time}}. You can still sign in with your other passkeys or a one-time code. If you didn't do this, review your account at {{security\_url}}. |
| **Passkeys removed (all)** | Subject: All passkeys were removed from your account. — Hi {{first\_name}}, all passkeys were removed from your {{brand}} account on {{time}}. You'll now sign in with a one-time code sent to {{masked\_contact}}. You can set up a new passkey any time at {{security\_url}}. If you didn't do this, contact us at {{support\_url}}. |
| **New device recognized** | Subject: New sign-in to your {{brand}} account. — Hi {{first\_name}}, your account was signed in to from a new device: {{device}}, near {{location}}, on {{time}}. If this was you, no action is needed. If not, contact us at {{support\_url}} and review your sign-in options at {{security\_url}}. |
| **Account recovered via passkey on a new device** | Subject: Your account was accessed with a passkey on a new device. — Hi {{first\_name}}, you signed in on {{device}}, near {{location}}, on {{time}} using a passkey synced from {{passkey\_provider}}. If this was you, you're all set. If not, remove the passkey at {{security\_url}} and contact us at {{support\_url}}. |
| **Customer name changed** | Subject: Your name was updated. — Hi {{first\_name}}, the name on your {{brand}} account was changed on {{time}}. If you didn't make this change, contact us at {{support\_url}}. *(Shows the new first name only; no full old/new names.)* |
| **Verify a new contact channel** *(added)* | Email — Subject: Confirm your new email for {{brand}}. Your confirmation code is **{{code}}**. It expires in 60 seconds. If you didn't ask to add this email, ignore this message. / SMS — {{brand}}: Code {{code}} confirms this number on your account. Expires in 60 seconds. |
| **Sign-in paused after too many codes** *(added)* | Subject: Sign-in paused for a few minutes. — Hi {{first\_name}}, there were too many incorrect or requested codes for your account, so we've paused sign-in until {{unlock\_time}}. You can try again after that. If you didn't try to sign in, no action is needed. |
| **Repeated failed sign-in attempts** *(added)* | Subject: Unsuccessful sign-in attempts on your account. — Hi {{first\_name}}, we saw {{count}} unsuccessful sign-in attempts from {{location}} on {{time}}. Your account is safe. If this wasn't you, consider adding a passkey at {{security\_url}}. |
| **Signed out of all devices** *(added)* | Subject: You've been signed out everywhere. — Hi {{first\_name}}, you were signed out of {{brand}} on all devices on {{time}}. Sign in again with a passkey or a one-time code. If you didn't request this, contact us at {{support\_url}}. |
| **Sign-in code for a sensitive action** *(added)* | Subject: Confirm it's you. — Your code to {{action\_description}} is **{{code}}**. It expires in 60 seconds. If you didn't start this, don't share the code and contact us at {{support\_url}}. *(Conditional: needed only if a customer without a passkey may confirm a sensitive action with a one-time code.)* |
| **Account closed** *(added)* | Subject: Your {{brand}} account has been closed. — Hi {{first\_name}}, your account and its saved passkeys were closed on {{time}}. Passkeys may still appear in your password manager; you can delete them there. If you didn't request this, contact us at {{support\_url}} within {{grace\_days}} days. |

**Why "Sign-in code for a sensitive action" is listed.** Sensitive actions such as starting a pre-qualification, changing the sign-in email or phone, or removing all passkeys should ask the customer to prove it's them again (step-up to T2). The planned step-up is a passkey sign-in, but a customer without a passkey on that device needs a fallback, usually a fresh one-time code. That code must name the action ("Your code to change your sign-in phone number is …"): if a stolen session triggers it, the real customer can see what is being attempted and not share the code, which a generic sign-in code wouldn't show. It is dropped if step-up is passkey-only, or if there is no step-up at all (weaker for a finance product).

## Who sends each template

Auth0 sends only the messages that carry a code or an unblock link (rows marked Auth0); every security notice needs a sender on the EDI / ecommerce side, triggered by the API call that made the change. "Proposed" in the sender column means ownership is still to be agreed.

| Template | Trigger | Sender | Channel | To |
| --- | --- | --- | --- | --- |
| Sign-in code – email | OTP start, email | Auth0 | Email | Contact used |
| Sign-in code – SMS | OTP start, phone | Auth0 | SMS | Contact used |
| Account temporarily blocked | Auth0 brute-force block | Auth0 | Email (phone template if phone-only) | Primary contact |
| First time registered | First OTP verify that creates the customer (Auth0 log `ss`) | EDI (proposed) | Email, else SMS | Primary contact |
| Contact channel added | EDI add-contact API | EDI (proposed) | Matching channel | Primary contact + new contact |
| Contact channel removed | EDI remove-contact API | EDI (proposed) | Matching channel | Removed contact + primary |
| Primary sign-in identifier changed | EDI change-identifier API | EDI (proposed) | Matching channel | Old + new identifier |
| Passkey enrolled | EDI register-complete (Auth0 log `gd_enrollment_complete` if it fires) | EDI (proposed) | Email, else SMS | Primary contact |
| Passkey removed (single / all) | EDI delete-passkey API | EDI (proposed) | Email, else SMS | Primary contact |
| New device recognized | Sign-in (Auth0 log `s`) from a device not seen before | EDI or ecommerce (proposed) | Email, else SMS | Primary contact |
| Account recovered via passkey on a new device | Passkey sign-in (`performed_amr` = `phr`) on a new device | EDI or ecommerce (proposed) | Email, else SMS | Primary contact |
| Customer name changed | Profile update (Event Streams `user.updated` or VPS) | VPS / ecommerce (proposed) | Email | Primary contact |
| Verify a new contact channel | Add-contact flow | EDI / Auth0 OTP | Matching channel | New contact |
| Sign-in paused after too many codes | Our BFF OTP limits or EDI lockout | BFF / EDI (proposed) | Email, else SMS | Primary contact |
| Repeated failed sign-in attempts | Failed-attempt threshold | EDI (proposed) | Email | Primary contact |
| Signed out of all devices | Sign-out-everywhere action | EDI (proposed) | Email | Primary contact |
| Sign-in code for a sensitive action | T2 step-up by OTP (only if OTP is allowed as a step-up fallback) | EDI, or Auth0 with a custom template (Auth0's passwordless OTP template can't name the action; the email version only varies by operation = change\_email) | Matching channel | Primary contact |
| Account closed | Account deletion | VPS / EDI (proposed) | Email | Primary contact |

**Rules for every security notice:** send to the primary contact even when the change came from it; send identifier and contact changes to **both** the old and new destination; mask contacts; include device, approximate location and time; never include a code or a one-click action link; and point to the in-app security page and support instead.

**Which channel:** email when the customer has one, else SMS. SMS bodies should be a short version of the email (under 160 characters, no links unless the brand's SMS policy allows them).

## Questions for the review

- [ ] Does the catalogue match `requirements-notifications.md`? (The file is in a private repo this session couldn't open.)
- [ ] Who owns sending security notices: EDI, VPS, or an ecommerce notification service? Which email and SMS providers does it use?
- [ ] Which external email provider and SMS provider are configured on the Auth0 tenants? Custom Auth0 templates need an external email provider.
- [ ] Is Auth0 brute-force protection on for the passwordless connections? If so, we need the blocked-account wording.
- [ ] Does EDI use Auth0's phone MFA (`otp_enroll` / `otp_verify`) anywhere, or only passwordless SMS?
- [ ] Should the Auth0 Welcome email be used for "First time registered" (email customers only), or should our sender handle it for both channels?
- [ ] Does Auth0 write `gd_enrollment_complete` for passkeys created through the Native Passkeys API, or must EDI's register-complete call trigger "Passkey enrolled"?
- [ ] Brand name, sender name and support URL for `{{brand}}` and `{{support_url}}`, and whether SMS may contain links.
- [ ] Which languages are needed? Auth0 templates use `request_language` / `locale`; our sender needs the same.
- [ ] Which of the six added templates are in scope for launch? In particular: for sensitive actions (pre-qualification, changing the sign-in contact, removing all passkeys), can a customer without a passkey confirm with a one-time code? If yes, keep "Sign-in code for a sensitive action" and decide who sends it; if no, drop it.

## Sources

- [Customize email templates](https://auth0.com/docs/customize/email/email-templates) — Auth0, the 11 email templates and when each is sent
- [Use Liquid syntax in email templates](https://auth0.com/docs/customize/email/email-templates/use-liquid-syntax-in-email-templates) — Auth0, common and template-specific variables
- [Configure external SMTP email providers](https://auth0.com/docs/customize/email/smtp-email-providers) — Auth0, built-in provider limits
- [Passwordless email OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/email-otp) — Auth0
- [Passwordless SMS OTP](https://auth0.com/docs/authenticate/passwordless/authentication-methods/sms-otp) — Auth0, SMS message and variables
- [Brute-force protection](https://auth0.com/docs/secure/attack-protection/brute-force-protection) — Auth0, blocked-account email and SMS, thresholds, unblocking
- [Auth0 Guardian](https://auth0.com/docs/secure/multi-factor-authentication/auth0-guardian) — Auth0, MFA enrollment invitations
- [Customize SMS or voice messages](https://auth0.com/docs/customize/customize-sms-or-voice-messages) — Auth0, MFA enrollment and verification messages
- [Unified phone experience for MFA](https://auth0.com/docs/customize/phone-messages/unified-phone/use-auth0s-unified-phone-experience-for-multi-factor-authentication) — Auth0, phone templates for MFA
- [Create a phone template (Management API)](https://auth0.com/docs/api/management/v2/branding/create-phone-template) — Auth0, the five phone template types
- [Monitor passkey events in tenant logs](https://auth0.com/docs/authenticate/database-connections/passkeys/monitor-passkey-events-in-tenant-logs) — Auth0, `ss`, `s`, `gd_enrollment_complete`
- [Create an event stream](https://auth0.com/docs/customize/events/create-an-event-stream) — Auth0, user lifecycle events
- [Passwordless best practices](https://auth0.com/docs/authenticate/passwordless/best-practices) — Auth0, code expiry and attempt limits
