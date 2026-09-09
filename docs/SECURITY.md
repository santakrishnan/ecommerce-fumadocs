# Security rules

Non-negotiable security rules for `apps/web`. These are enforced in code review.

## Input handling

- **All Server Action inputs are validated with Zod.** No exceptions.
- **All route handler bodies are validated with Zod** before being passed to a service.
- **User content is rendered as text** — React escapes by default. Never use `dangerouslySetInnerHTML`. If you genuinely need to render HTML, sanitize it server-side first.

## Secrets and tokens

- **No hardcoded secrets** in source code. All secrets come from environment variables, read on the server only.
- **No `NEXT_PUBLIC_*` for sensitive values** — `NEXT_PUBLIC_*` env vars are bundled into the client.
- **Auth tokens use `httpOnly` cookies.** Never store tokens in `localStorage` or `sessionStorage`.
- **Sealed/encrypted cookies** for any payload the client shouldn't be able to read. Use `jose` (JWE) when sealing.

## Network and CSP

- **No inline scripts.** Use external modules.
- **No `eval()`** or `new Function(...)`.
- **CSP-compliant** — if a feature needs to bypass CSP, raise it as a separate decision.

## Server boundary discipline

- **Per-user data stays server-side.** Server Components that read user identity (cookies, sessions) must not be wrapped in a shared `"use cache"` scope.
- **Sensitive data is stripped before it crosses to the client.** Only expose the fields the UI needs — never spread a full user/profile object into client state.
- **Headers and cookies are read outside `"use cache"`.** Pass the values into the cached function as arguments.

## Dependencies

- **No new packages without explicit approval** in the ticket / PR description.
- **Lockfile is the source of truth** — `pnpm-lock.yaml` is committed and reviewed.

## What to do if you spot a vulnerability

Open a private security advisory in GitHub. Don't post details in a public PR or issue.
