# UCMP

A reusable **Next.js 16 + Turborepo monorepo scaffolding**, derived from a production e-commerce codebase with all domain-specific code stripped out. Drop your own features into the `features/` folders, swap brand tokens in `@ucmp/ui-theme/themes/default`, and ship.

## What you get

- **Next.js 16** with App Router, `"use cache"`, Server Components, Turbopack, React Compiler
- **React 19** with Server Components + the `use()` hook for context
- **Turborepo** monorepo with pnpm workspaces, shared TypeScript / Vitest configs
- **`@ucmp/ui`** — ~25 shadcn-style primitives reimplemented on **Base UI** (the modern Radix successor) instead of Radix
- **`@ucmp/ui-theme`** — inheritance-based multi-brand theming (base tokens + per-theme overrides + light/dark) using Tailwind v4 `@theme`
- **`@ucmp/shared`** — generic providers, hooks, utils
- **`utils`** — pure utilities (cn, slugify, formatters, validators)
- **Screaming architecture** for `apps/web/src/features/` — each feature owns its components/hooks/services/data
- **Biome + Ultracite** for linting and formatting
- **Vitest + Testing Library** for tests, with a Next.js setup preset

## Quick start

```bash
# Prerequisites: Node >= 20, pnpm >= 10
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev                                  # http://localhost:3000
```
## Mock data vs real services

The app ships with **fixture mocks** for every backend (BED) call, so it runs
fully offline out of the box — copy `.env.local.example` and every page renders
from fixtures.

Switching to the real BED is **per service**. For the migrated **visitors**
service (profile resolve + suggestions) and the **search** service (filtered
search results + conversational agent v2):

| Goal | `.env.local` |
| --- | --- |
| All fixtures (default) | `USE_*_MOCKS=true`, `API_UPSTREAM_URL` unset |
| Real visitors service | set `API_UPSTREAM_URL`, `VISITORS_API_KEY`, `BED_TENANT_ID`; `USE_PROFILE_MOCKS=false` |
| Real search results/agent | set `API_UPSTREAM_URL`, `SEARCH_API_KEY`, `BED_TENANT_ID`; `USE_SEARCH_RESULTS_MOCKS=false` (agent: `SEARCH_AGENT_BACKEND=v2`) |

- `USE_<FEATURE>_MOCKS=true` **wins** — force fixtures for a feature regardless of config.
- A migrated service goes real only when the shared `API_UPSTREAM_URL` **and** its own `*_API_KEY` are set; the domain alone never flips it.
- Migrated onto the BED contract (`resolveBedService` + `readVisitorIdentity` + `createBedClient`): **visitors** and **search** (results + conversational agent v1/v2 + filters). Anonymous visitors omit `X-Visitor-Id` / `X-Session-Id`.
- Legacy services (geo, recommendations, VDP) are mid-migration and still go real on `API_UPSTREAM_URL` presence — keep it unset for all-fixtures dev.

Full scheme in [`docs/HTTP.md`](docs/HTTP.md) and [`apps/web/src/config/bed-services.ts`](apps/web/src/config/bed-services.ts).


## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build (all packages) |
| `pnpm start` | Run the production build |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm test:watch` | Watch mode |
| `pnpm test:coverage` | Coverage report (v8) |
| `pnpm lint` | Lint all packages (Biome) |
| `pnpm check` | Format check (Ultracite) |
| `pnpm fix` | Auto-fix formatting (Ultracite) |
| `pnpm type-check` | TypeScript check across the monorepo |
| `pnpm clean` | Remove build artifacts + node_modules |
| `pnpm ui:add <name>` | Add a shadcn component into `@ucmp/ui` |

## Monorepo structure

```
apps/
  web/                      # Next.js 16 app — the main entry point
packages/
  ui/                       # @ucmp/ui — Base UI primitives, shadcn-style API
  ui-theme/                 # @ucmp/ui-theme — Tailwind v4 design tokens, multi-brand
  shared/                   # @ucmp/shared — generic providers, hooks, utils
  utils/                    # utils — pure helpers (cn, slugify, formatters)
  config/
    typescript/             # @ucmp/tsconfig — shared tsconfigs
    vitest/                 # @ucmp/vitest-config — shared vitest configs + test-utils
```

## Path aliases (apps/web)

| Alias | Resolves to |
| --- | --- |
| `@features/*` | `./src/features/*` |
| `@shared/*` | `./src/shared/*` |
| `@config/*` | `./src/config/*` |
| `@layout/*` | `./src/layout/*` |
| `~/*` | `./src/*` |
| `@/*` | `../../packages/ui/src/*` |
| `utils` | `../../packages/utils/src` |

## Architecture highlights

### Theming — inheritance-based multi-brand

`@ucmp/ui-theme/base` holds the generic tokens. Each theme under `@ucmp/ui-theme/themes/<brand>/` only **overrides** what differs from base. Apps import a single theme file:

```css
/* apps/web/src/app/globals.css */
@import "@ucmp/ui-theme/themes/default";
```

Add a new brand by copying `themes/default/`, swapping colors in `overrides/colors.css`, and registering the export in `packages/ui-theme/package.json`.

### UI — Base UI primitives, shadcn-style

`@ucmp/ui` exposes ~25 components (`Dialog`, `Select`, `DropdownMenu`, `Popover`, `Tooltip`, `Tabs`, `Accordion`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `NavigationMenu`, `Menubar`, `Toggle`, `ToggleGroup`, `Progress`, `Avatar`, `NumberField`, `ScrollArea`, …) with shadcn-style named exports — but they're built on `@base-ui/react` (the spiritual successor to Radix by the same team).

```tsx
import { Button, Dialog, DialogContent, DialogTrigger } from "@ucmp/ui";

<Dialog>
  <DialogTrigger render={<Button>Open</Button>} />
  <DialogContent>Hello</DialogContent>
</Dialog>
```

### Features — screaming architecture

Each subfolder of `apps/web/src/features/` is a self-contained module:

```
features/landing/
├── components/
├── hooks/
├── services/
├── data/
├── lib/
├── __tests__/
└── index.ts        # public surface
```

See `apps/web/src/features/README.md` for the rules of the road.

### React Compiler enabled

`apps/web/next.config.ts` enables `reactCompiler: true`. As a result:

- **Don't** use `useMemo` / `useCallback` / `React.memo` — the compiler auto-memoizes.
- `useExhaustiveDependencies` is **off** in `biome.json` — the compiler is the source of truth.

If you ever disable the compiler, flip both back on.

### Cache profiles

`next.config.ts` defines named cache profiles (`landing`, `profile`, `detail`, `search`). Use them in Server Components via `cacheLife()`:

```tsx
"use cache";

import { cacheLife } from "next/cache";

export async function loadHomeStats() {
  cacheLife("landing");
  // …
}
```

## Adding a shadcn component

```bash
pnpm ui:add accordion        # adds into packages/ui/src/components/
```

The `style: "base-vega"` setting in `packages/ui/components.json` makes the shadcn CLI install the **Base UI** variant of each component — no manual Radix → Base UI conversion needed. Same for `apps/web/components.json`.

## Editor & AI agent support

Works out of the box with **VS Code, Cursor, Kiro, JetBrains, and Zed**, plus any AI agent that supports the AGENTS.md standard.

### VS Code (and Cursor)

Open the repo and accept the prompt to install recommended extensions ([`.vscode/extensions.json`](.vscode/extensions.json)) — Biome, Tailwind CSS IntelliSense (Tailwind v4-aware), EditorConfig, Pretty TypeScript Errors, Conventional Commits, Vitest Explorer. Workspace defaults in [`.vscode/settings.json`](.vscode/settings.json) set Biome as the formatter, enable format-on-save and organize-imports, point Tailwind IntelliSense at the CSS-first config, and use the workspace TypeScript SDK.

### Coding agents

- **Project instructions** live in [`AGENTS.md`](AGENTS.md) — the open standard read by Cursor, GitHub Copilot, Codex, Continue, Kiro, Windsurf, Junie, Devin, Aider, Zed, Warp, Gemini CLI, opencode and others.
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — GitHub Copilot-specific instructions (condensed Do/Don't + architecture).
- [`.kiro/project.md`](.kiro/project.md) — KIRO project context file with the same conventions.
- Project-level **skills** ship in [`.agents/skills/`](.agents/skills/) (universal — works for Cursor, Kiro, Copilot, Cline, Continue) with Claude Code copies at [`.claude/skills/`](.claude/skills/). Restore after a fresh clone with `npx skills experimental_install`; update with `npx skills update`.

## Documentation

| Document | What's inside |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Project guide for AI coding agents (Claude Code, Cursor, Kiro, Copilot, …) |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | GitHub Copilot-specific Do/Don't and architecture summary |
| [`.kiro/project.md`](.kiro/project.md) | KIRO project context with conventions and patterns |
| [`packages/ui-theme/README.md`](packages/ui-theme/README.md) | Theme usage and how to add a brand |
| [`packages/ui-theme/STRUCTURE.md`](packages/ui-theme/STRUCTURE.md) | Deep dive on the inheritance pattern |
| [`packages/ui/README.md`](packages/ui/README.md) | Component inventory + Base UI rationale |
| [`packages/shared/README.md`](packages/shared/README.md) | Provider/hook/util guidelines |
| [`apps/web/src/features/README.md`](apps/web/src/features/README.md) | Screaming-architecture rules |
| [`docs/adr/0011-typed-env-vars.md`](docs/adr/0011-typed-env-vars.md) | ADR-0011: typed & validated env vars — schema design, Proxy pattern, and how to add a new variable |

