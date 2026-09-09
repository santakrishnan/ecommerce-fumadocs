# ADR-0011: Typed & validated environment variables

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-10 |
| **Authors** | Engineering team |
| **Stakeholders** | Engineering, DevOps, Security |
| **Supersedes** | — |
| **Superseded by** | — |

---

## 1. Context

Environment variables in `apps/web` were read via raw `process.env.*` with no validation, no typing, and no enforcement of the server/client boundary. This caused two recurring failure classes:

- Missing or malformed required vars were discovered at **runtime**, not at build or setup time.
- Vercel deploys could succeed with a misconfigured var and only fail on the first production request.

Zod v4 was already installed in `apps/web`. No new dependency is needed.

---

## 2. Decision

**A two-layer hybrid: build-time Zod validation gate + runtime-typed access modules backed by a shared schema.**

| Layer | File | Responsibility |
|---|---|---|
| Build-time gate | `next.config.ts` | Merges server + client schema, calls `safeParse(process.env)`, aborts `next build` with a per-field error list if any var is invalid |
| Shared schema | `src/config/env-schema.ts` | Single source of truth for all vars — no `"server-only"` guard so `next.config.ts` can consume it |
| Server module | `src/config/env.ts` | `import "server-only"` + exports typed `env`; build error if a Client Component imports it |
| Client module | `src/config/client-env.ts` | Parses `NEXT_PUBLIC_*` via explicit property access (required for Next.js bundler inlining); safe for Server and Client Components |

### Why not `@t3-oss/env-nextjs`

Requires every var in a `runtimeEnv` object and adds a dependency that provides nothing beyond what Zod 4 already delivers. Rejected.

---

## 3. Schema design

### Helpers

| Helper | Definition | Used for |
|---|---|---|
| `optStr` | `z.string().min(1).optional()` | Generic optional strings |
| `trimOptStr` | preprocess trim → `z.string().min(1).optional()` | Header / token values where whitespace would produce malformed HTTP requests (e.g. `BED_TENANT_ID`) |
| `boolStr` | `z.enum(["true", "false"]).optional()` | String-encoded boolean toggles |
| `optUrl` | preprocess `""` → `undefined` → `z.string().url().optional()` | URL vars — tests stub `""` to mean "not configured"; the preprocessor prevents URL validation from rejecting empty strings |

### Server / client split

- `serverEnvSchema` — all vars without `NEXT_PUBLIC_`. Never reaches the client bundle; consumed via `env.ts` which carries `import "server-only"`.
- `clientEnvSchema` — `NEXT_PUBLIC_*` vars only. Explicitly destructured in `client-env.ts` so the Next.js bundler can statically inline each value.

### Production-required vars

`REVALIDATION_SECRET` uses `isProduction ? z.string().min(1) : optStr` — the production build fails if unset, preventing an open revalidation endpoint.

### `FEATURE_FLAG_*` exclusion

Feature flag env vars (`FEATURE_FLAG_<name>`) are assembled dynamically from flag names at runtime. The set is open-ended by design and cannot be statically enumerated. These remain as raw `process.env[envKey]` reads, outside the schema. Acceptable: they are non-secret config toggles managed via the Vercel flags SDK.

---

## 4. `env.ts` — Proxy design

`env` is exported as a `Proxy` rather than the plain `parsed.data` snapshot for test compatibility.

**Problem with `parsed.data` directly**: it is a snapshot evaluated once at module load. `vi.stubEnv()` modifies `process.env` but the snapshot is already frozen, which caused 16 test failures in the POC.

**Why not `vi.resetModules()` in tests**: converting to the `resetModules` + dynamic import pattern would require changes across 24 test files with 121+ `vi.stubEnv()` calls. High churn, no production benefit.

**Proxy approach**: on each property access, reads from live `process.env` and re-applies the per-field Zod schema. This preserves coercion (e.g. `z.coerce.number()` still returns a `number`, not a string) while keeping `vi.stubEnv()` working. If the accessed value fails its field schema, the initially-validated value from `parsed.data` is returned as a safe fallback.

---

## 5. Results

The migration from raw `process.env.*` to typed access modules is complete across `apps/web/src/`, except for the documented exceptions in §7. The build-time gate in `next.config.ts` validates every var against the schema before `next build` proceeds.

### Positive
- Missing or malformed required vars fail the **build**, not the first production request.
- `env.*` access is fully typed — autocomplete, rename refactoring, and "go to definition" work across the entire codebase.
- `import "server-only"` in `env.ts` guarantees secrets cannot reach the client bundle at compile time.
- `env-schema.ts` is a single readable inventory of every env var the app depends on.
- No new package dependency.
- CI is covered by `.env.ci.example` — all mock toggles active, no real upstream contacted during builds or tests.

### Trade-offs
- `env-schema.ts` must be kept in sync — a new `process.env.NEW_VAR` that is not in the schema still works at runtime but will not be typed or validated until added.
- The Proxy re-runs a field-level `safeParse` on every `env.*` access. Overhead is negligible (microseconds); in production `process.env` is frozen after startup.
- `FEATURE_FLAG_*` vars remain outside the schema and untyped by design.

---

## 6. How to add a new environment variable

### Step 1 — Choose the right schema and helper

| Variable type | Schema | Helper |
|---|---|---|
| Server-only secret / key | `serverEnvSchema` in `env-schema.ts` | `optStr` or `trimOptStr` (tokens/headers) |
| Server-only boolean toggle | `serverEnvSchema` | `boolStr` |
| Server-only URL | `serverEnvSchema` | `optUrl` |
| Server-only number | `serverEnvSchema` | `z.coerce.number().positive().optional()` |
| Required in production only | `serverEnvSchema` | `isProduction ? z.string().min(1) : optStr` |
| Public / client-safe | `clientEnvSchema` in `env-schema.ts` | same helpers; name must start with `NEXT_PUBLIC_` |
| Feature flag | **Do not add to schema** — use the Vercel `flags` SDK | raw `process.env[envKey]` |

### Step 2 — Add the field to the schema

```ts
// apps/web/src/config/env-schema.ts
export const serverEnvSchema = z.object({
  // … existing fields …
  MY_NEW_SECRET: trimOptStr,       // server-only
});

// or for a public var:
export const clientEnvSchema = z.object({
  // … existing fields …
  NEXT_PUBLIC_MY_FLAG: optStr,     // client-safe
});
```

### Step 3 — Expose public vars in `client-env.ts`

If the new var is `NEXT_PUBLIC_*`, add an explicit property access in `client-env.ts` so the Next.js bundler can statically inline it:

```ts
// apps/web/src/config/client-env.ts
const parsed = clientEnvSchema.safeParse({
  // … existing entries …
  NEXT_PUBLIC_MY_FLAG: process.env.NEXT_PUBLIC_MY_FLAG,
});
```

Server vars are picked up automatically — no change to `env.ts` needed.

### Step 4 — Consume it

```ts
// Server Component, Server Action, Route Handler, BFF service
import { env } from "@config/env";
const value = env.MY_NEW_SECRET;          // string | undefined

// Client Component or shared code
import { clientEnv } from "@config/client-env";
const flag = clientEnv.NEXT_PUBLIC_MY_FLAG; // string | undefined
```

### Step 5 — Document it in the example files

Add the var (commented out or with its default) to both:

- `apps/web/.env.local.example` — for local development.
- `apps/web/.env.ci.example` — for CI. If optional, **omit the line entirely** (do not set `VAR=`). Only `optUrl` vars tolerate an empty string; all other helpers require the var to be absent to resolve as `undefined`.

### Step 6 — Add it to the Vercel dashboard

For production and preview deployments, set the var in the Vercel project settings under **Settings → Environment Variables**. Required vars that are missing will cause `next build` to fail with a clear per-field error message.

---

## 7. Documented exceptions

A small number of files intentionally continue to read `process.env` directly. Each is documented here with its rationale. The affected file contains a short inline comment referencing this section.

### `process.env.NODE_ENV` — platform variable, not schema-managed

`NODE_ENV` is injected by Node.js and Next.js; it is not a project-defined variable and must never be added to `env-schema.ts`. It is always available and typed by `@types/node`. All `process.env.NODE_ENV` guards in the codebase are intentional and correct.

### `bed-services.ts` — dynamic registry via typed accessor functions

**File:** `src/config/bed-services.ts`

The service registry previously resolved env var names via a dynamic `getEnvStr(key: string)` helper that cast through `unknown`, bypassing type safety. Because the registry is keyed by service name and not by var name, direct property access on `env` is not possible — the key is only known at lookup time.

The solution was to store **typed accessor functions** in the registry instead of string keys:

```ts
// Before — dynamic lookup, unsafe cast
interface BedServiceDefinition {
  apiKeyEnv: string; // "VISITORS_API_KEY"
}
function getEnvStr(key: string): string | undefined {
  return (env as unknown as Record<string, string | undefined>)[key];
}

// After — typed accessor, no cast
interface BedServiceDefinition {
  apiKey: () => string | undefined;
}
visitors: {
  apiKey: () => env.VISITORS_API_KEY,
}
```

The accessors are evaluated lazily at call time, so `vi.stubEnv()` in tests works without `vi.resetModules()`.

### `media-constants.ts` — `NEXT_PUBLIC_MEDIA_CDN_URL` read via `process.env`

**File:** `src/shared/lib/media/media-constants.ts`

Two constraints require reading `process.env.NEXT_PUBLIC_MEDIA_CDN_URL` directly rather than via `clientEnv`:

1. **Next.js bundler inlining** — the bundler can only statically inline `NEXT_PUBLIC_*` vars when it encounters a literal `process.env.NEXT_PUBLIC_*` expression. Assigning through `clientEnv` prevents the bundler from recognising the pattern.
2. **Test compatibility** — tests stub this var with `vi.stubEnv()` at call time. `clientEnv` is a frozen snapshot evaluated at module load; stubs applied after load are invisible to it.

The var is still validated at build time via `clientEnvSchema` in `next.config.ts`.

### `resolve-agent-backend.ts` — `SEARCH_AGENT_BACKEND` read via `process.env`

**File:** `src/features/search/bff/lib/resolve-agent-backend.ts`

Tests use `vi.stubEnv("SEARCH_AGENT_BACKEND", "")` to express "not configured". The `env` Proxy applies the `optStr` schema (`z.string().min(1)`) to the live value — `""` fails `min(1)`, so the Proxy falls back to the initial `parsed.data` snapshot. When the first test in a suite loads the module with a non-empty stub, the snapshot captures that value; subsequent tests that stub `""` then receive the leaked snapshot value instead of `undefined`.

Reading `process.env.SEARCH_AGENT_BACKEND` directly avoids the fallback: `""?.trim() || DEFAULT` correctly evaluates to the default. The var is still validated at build time by `serverEnvSchema` in `next.config.ts`.

### `encryption.ts` — isomorphic module, cannot import `env.ts`

**File:** `src/shared/lib/http/encryption.ts`

This module is used on both server and client (isomorphic). Importing `env.ts` would pull in `import "server-only"`, producing a build error when the module is bundled for the client. `process.env.ENCRYPTION_KEY` is therefore read directly for the server context, and `clientEnv.NEXT_PUBLIC_ENCRYPTION_KEY` is used as the client-side fallback. Both vars are validated via their respective schemas in `next.config.ts`.
### `mock-delay.ts` — client-reachable module, cannot import `env.ts`

**File:** `src/features/search/bff/lib/mock-delay.ts`

`mock-delay.ts` is re-exported via `search/index.ts` → `autocomplete-mock.ts`, which is consumed by Client Components (`use-search-suggestions.ts`, `search-conversational-controller.tsx`). Importing `env.ts` would carry `server-only` into the client bundle and cause a build error.

`process.env.MOCK_LATENCY` is read directly; in client context it is always `undefined` (the var is server-only), so `isMockLatencyEnabled()` correctly returns `false`. The var is validated at build time by `serverEnvSchema` in `next.config.ts`.
