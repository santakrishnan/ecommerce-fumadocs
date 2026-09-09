# Architecture

A one-page tour of UCMP's moving parts and how they fit together.

## Top-level shape

```
┌──────────────────────────────────────────────────────┐
│  apps/web   (Next.js 16 app)                         │
│    ↓ imports                                          │
│  packages/ui       packages/ui-theme   packages/shared│
│  packages/utils    packages/config/*                  │
└──────────────────────────────────────────────────────┘
```

Apps live in `apps/`. Reusable code lives in `packages/`. Turborepo + pnpm workspaces wire them together.

## Layering rules

1. `apps/web` may import from any package.
2. `@ucmp/ui` may import from `@ucmp/ui-theme`, `@ucmp/shared`, `utils`.
3. `@ucmp/shared` may import from `utils` only.
4. `@ucmp/ui-theme` is CSS-only — no JS imports.
5. `utils` is leaf-level — depends on nothing in the repo.

A package may not reach "up" into an app, and the leaf packages don't reach across each other.

## Inside `apps/web/src`

```
app/             Next.js App Router — pages, layouts, route handlers
config/          Routes, fonts, feature flags, query keys
features/        Feature modules (screaming architecture)
layout/          Header, footer, app shell
shared/          App-level shared components / hooks / lib / providers
test-shims/      Vitest shims (e.g. `server-only` no-op)
types/           Global ambient declarations
```

### Provider hierarchy

```
ThemeProvider           ← from @ucmp/shared/providers
└── QueryProvider       ← from apps/web/src/shared/providers
    └── {children}
```

Wired up in `src/app/layout.tsx` via `composeProviders(...)`.

### Features

Each `src/features/<name>/` is self-contained:

```
features/<name>/
├── components/       React components owned by this feature
├── hooks/            Feature-scoped React hooks
├── services/         Data-fetching, API clients, server actions
├── data/             Mock data, feature-local types
├── lib/              Pure helpers, parsers, formatters
├── __tests__/        Co-located tests
├── index.ts          PUBLIC SURFACE — only export what others may use
└── README.md
```

## Theming

```
@ucmp/ui-theme/
├── base/tokens/                   Generic design tokens (colors, spacing, …)
├── base/index.css                 Tailwind + base tokens + body styles
├── themes/default/                Neutral starting theme
│   ├── overrides/                 Only what differs from base
│   ├── light.css                  Light-mode semantic colors
│   ├── dark.css                   Dark-mode semantic colors (prefers-color-scheme)
│   └── index.css                  Self-contained: imports base + overrides + modes
└── themes/acme/                   Second example theme (purple)
```

Apps import a single theme file:
```css
@import "@ucmp/ui-theme/themes/default";
```

## UI components

`@ucmp/ui` exposes shadcn-style named exports (`Dialog`, `DialogTrigger`, `DialogContent`, …) reimplemented using **Base UI** (`@base-ui/react`).

Base UI uses dotted subcomponents (`Dialog.Root`, `Dialog.Popup`, `Dialog.Backdrop`) and CSS-friendly data attributes for state styling (`data-starting-style`, `data-ending-style`, `data-popup-open`, `data-selected`, `data-checked`). The wrappers in `@ucmp/ui` keep the consumer-facing API stable and shadcn-like.

## Caching strategy

`next.config.ts` defines named cache profiles. Use them inside `"use cache"` server functions:

```tsx
"use cache";

import { cacheLife, cacheTag } from "next/cache";

export async function loadHomeStats() {
  cacheLife("landing");
  cacheTag("home-stats");
  return await fetch("…").then((r) => r.json());
}
```

Invalidate on demand by POSTing to `/api/revalidate?tag=<tag>&secret=$REVALIDATION_SECRET`.

## BFF & BED integration

Each feature talks to the backend (**BED**) through a small BFF stack, never
directly from a component:

```
route handler / server action        ← reads request (cookies, headers)
  └─ use-case  (getProfileResolve)    ← decides mock vs real; owns error shape
       └─ upstream service            ← builds the HTTP call
            └─ createBedClient(...)    ← the BED HTTP client
```

### BED service registry — one domain, per-service key

All BED services share one domain (`API_UPSTREAM_URL`); each has its own
**versioned path prefix** and **API key**. The registry
([`src/config/bed-services.ts`](../apps/web/src/config/bed-services.ts)) is the
single place composition happens:

```
API_UPSTREAM_URL=https://api.sandbox.arrow.toyotafinancial.com   # shared domain
VISITORS_API_PATH=/visitors/v1   VISITORS_API_KEY=…              # per service
SEARCH_API_PATH=/search/v1       SEARCH_API_KEY=…
BED_TENANT_ID=…                                                  # shared tenant
```

`resolveBedService(name)` → `{ serviceName, baseUrl, apiKey, tenantId }` (or
`null` when unconfigured). `createBedClient(service, identity?)` wraps the
generic `createServerClient` and pre-wires the BED contract headers — `X-API-Key`,
`X-Tenant-Id`, `X-Visitor-Id`/`X-Session-Id`, `X-Trace-Id`. See
[`docs/HTTP.md`](./HTTP.md) for the client details.

### Mock vs real — per-service, on one shared domain

The decision is per-service, so one page can run some features against real BED
and others on fixtures:

1. `USE_<FEATURE>_MOCKS=true` → **mock** (explicit override, always wins).
2. else the service is configured (shared domain **and** its own `*_API_KEY`) → **real**.
3. else → 503.

The **per-service API key is the enable switch** — the shared `API_UPSTREAM_URL`
alone never flips a service to real. This is why setting the domain for one
service doesn't drag the others live.

## Testing

- Vitest (jsdom) for unit + component tests
- `@ucmp/vitest-config/nextjs` preset provides router / Image / matchMedia mocks
- `@ucmp/vitest-config/test-utils` re-exports `render`, `screen`, `userEvent`, `vi`
- Tests co-located in `__tests__/` next to source

## Linting & formatting

- Biome via Ultracite presets (`ultracite/biome/core`, `next`, `react`)
- Pre-commit hook (`husky` + `lint-staged`) auto-formats and runs related tests
- `pnpm fix` to auto-format the whole repo
