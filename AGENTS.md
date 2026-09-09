# AGENTS.md

Project guidance for AI coding agents working in this repo. See [agents.md](https://agents.md) for the open standard.

## Project overview

**UCMP** — a reusable Next.js 16 monorepo scaffolding. Use it as the starting point for new apps.

Each package may have its own supplemental `AGENTS.md` — always read it before modifying that package.

## Quick start

```bash
nvm use                           # Node 22.22.2 (see .nvmrc)
corepack prepare pnpm@11.0.9 --activate
pnpm install
cp apps/web/.env.local.example apps/web/.env.local
pnpm dev                          # http://localhost:3000
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build (all packages) |
| `pnpm test` | Run all tests (Vitest 4) |
| `pnpm lint` | Lint (Biome) |
| `pnpm check` | Format check (Ultracite) |
| `pnpm fix` | Auto-fix formatting (Ultracite) |
| `pnpm type-check` | TypeScript check |
| `pnpm ui:add <name>` | Add a shadcn component to `packages/ui` (Base UI variant via `style: "base-vega"`) |

## Monorepo structure

```
apps/web/                     # Next.js 16 app
packages/ui/                  # @ucmp/ui — Base UI primitives, shadcn-style
packages/ui-theme/            # @ucmp/ui-theme — Tailwind v4 multi-brand tokens
packages/shared/              # @ucmp/shared — providers, hooks, utils
packages/utils/               # utils — pure helpers (cn, slugify, formatters, validators)
packages/config/typescript/   # @ucmp/tsconfig
packages/config/vitest/       # @ucmp/vitest-config
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

## Key versions

| Tech | Version | Notes |
| --- | --- | --- |
| Node | 22.22.2 LTS | pinned in `.nvmrc` |
| pnpm | 11.0.9 | pinned in `packageManager` field |
| Next.js | 16.x | `"use cache"`, App Router, Turbopack, React Compiler enabled |
| React | 19.x | Server Components, `use()` hook |
| TypeScript | 5.9 | strict mode, `noUncheckedIndexedAccess` |
| Tailwind | 4.x | CSS-first via `@theme`, no JS config file |
| Biome | 2.x | via Ultracite presets |
| Vitest | 4.x | jsdom 29 |
| Turborepo | 2.x | |
| Base UI | 1.x | `@base-ui/react` |
| Forms | react-hook-form 7.x + Zod 4.x + `@hookform/resolvers` | |
| Icons | lucide-react | |
| Theme switching | next-themes | |
| Feature flags | Vercel `flags` SDK | |

## Do / Don't — quick reference

### React & components
| Do | Don't |
| --- | --- |
| Write Server Components by default | Add `"use client"` unless you need state, effects, or browser APIs |
| Push `"use client"` to the smallest possible leaf (client islands inside server shells) | Mark a whole page or layout client-only because one child needs it |
| Write plain functions and inline computations | Wrap in `useMemo`, `useCallback`, or `React.memo` — React Compiler handles it |
| Use `useEffect` only for real side effects (subscriptions, DOM, async) | Use `useEffect` for derived state — compute inline during render |
| Use `<Context value={...}>` shorthand and `use(Context)` | Use `<Context.Provider>` or `useContext()` — those are pre-React-19 |
| Pass `ref` as a regular prop with `React.ComponentProps<...>` | Use `forwardRef` — React 19 doesn't need it |
| Use composition and compound components for variants | Use boolean props to toggle behavior (`<Card isCompact isFeatured>`) |
| Use Base UI's `render` prop (`<Button render={<Link />}>`) | Use the `asChild` pattern (Base UI, not Radix) |
| Await `params` and `searchParams` (Promises in Next.js 16) | Destructure params synchronously |
| Keep `page.tsx` exports **synchronous** — pass Promises (`params`, fetches) down to async leaf components wrapped in `<Suspense>` | Make page functions `async` and `await` at the top — blocks the static shell from streaming, defeats PPR |

### Imports & module boundaries
| Do | Don't |
| --- | --- |
| Use path aliases (`@features/`, `@shared/`, `@config/`, `@layout/`) | Use relative `../../` paths to escape a module boundary |
| Use `import type` for type-only imports | Use value imports for types (Biome enforces `useImportType`) |
| Keep features self-contained in `features/<name>/` | Import internals across features (`@features/x/components/internal.tsx`) |
| Re-export only the public surface from `features/<name>/index.ts` | Import deep paths from another feature's internal files |
| Use `@ucmp/ui` primitives first | Hand-roll components that already exist in the UI package |

### Styling & theming
| Do | Don't |
| --- | --- |
| Use semantic tokens from `@ucmp/ui-theme` (`bg-primary`, `text-muted`) | Hardcode colors or magic values (`#3b82f6`, `rounded-[8px]`) |
| Define design tokens via `@theme` in CSS (Tailwind v4 is CSS-first) | Create a `tailwind.config.ts` file |
| Use OKLCH for colors | Use HSL or hex in token definitions |
| Use Tailwind utilities or CVA variants | Use `@apply`, inline `style={...}`, CSS modules, or `styled-components` |
| Use `cn()` from `utils` for conditional classes | Concatenate class strings with template literals |
| Use CVA (`class-variance-authority`) for component variants | Hand-roll variant logic with if/else class strings |
| Keep `data-slot` attributes on shadcn primitives | Remove `data-slot` — it's used as a styling hook |
| Use Sonner for toast notifications | Use the deprecated shadcn `Toast` component |
| Use `next-themes` (`useTheme()`) for light/dark switching | Roll your own theme toggle / localStorage logic |
| Use Tailwind's spacing scale (`p-4`, `gap-6`, `text-sm`) — rem-based, scales with user font-size | Use arbitrary px values (`p-[14px]`, `text-[15px]`, `gap-[10px]`) |
| Use `px` only for borders, hairlines, focus rings, and breakpoints | Use `px` for spacing, typography, or icon sizing |
| Use `em` for letter-spacing (`tracking-*`) and proportional offsets | Use `em` for spacing or sizes — it compounds unpredictably |

### Forms & validation
| Do | Don't |
| --- | --- |
| Use `react-hook-form` with `zodResolver` for client-side forms | Manage form state with `useState` per field |
| Define a Zod schema once and reuse it on client (RHF) and server (Server Action) | Validate inputs only in one place |
| Submit via Server Actions for mutations | `fetch()` POST from `onSubmit` in a Client Component |
| Use `useFormStatus` from `react-dom` for submit-button pending state | Prop-drill an `isPending` flag from the form root |
| Return `{ success, error?, data? }` from Server Actions | Throw raw errors — the action becomes hard to type and `useActionState` will hang |

### Icons & UI helpers
| Do | Don't |
| --- | --- |
| Use custom brand icons from `@ucmp/ui/icons` (`IconHome`, `IconCar`, etc.) | Use `<img>` tags for SVG icons |
| Use `lucide-react` for generic UI icons not in the brand set | Add another icon library beyond lucide + brand icons |
| Size icons with Tailwind `size-4` / `size-5` (rem-based) | Use `width={16} height={16}` props |
| Wrap interactive icons in a `Button` or accessible element with `aria-label` | Render bare `<svg>` for click targets |
| Use `inline-flex` + token sizing for icons-beside-text alignment | Rely on default vertical-align — produces sub-pixel misalignment |
| Theme icons via `text-*` utilities (icons use `currentColor`) | Hardcode fill/stroke colors in icon usage |

### Data, caching & state
| Do | Don't |
| --- | --- |
| Use `"use cache"` with `cacheLife("landing"\|"profile"\|"detail"\|"search")` | Roll your own cache headers or use deprecated `unstable_cache` |
| Use `cacheTag()` and `revalidateTag()` for invalidation | Rely on implicit `fetch()` caching (deprecated in Next.js 16) |
| Read `cookies()`, `headers()`, `searchParams` outside `"use cache"` and pass as args | Call them inside a `"use cache"` scope — they're not allowed there |
| Use Server Actions for all mutations | Use `fetch()` POST from Client Components |
| Use TanStack React Query for client-side reads of server state | Add Redux, Zustand, Jotai, Recoil, or MobX |
| Use `useState`/`useReducer` for local UI state | Reach for global state when a parent prop or context would do |
| Use the Vercel `flags` SDK for feature flags | Read `process.env.NEXT_PUBLIC_FLAG_*` directly in components |
| Use `env` from `src/config/env.ts` for server vars | Read `process.env.VAR` directly in server code |
| Use `clientEnv` from `src/config/client-env.ts` for `NEXT_PUBLIC_*` vars | Read `process.env.NEXT_PUBLIC_VAR` directly in components |
| Validate API inputs with Zod | Trust unvalidated request data |

### Routing, loading & error handling
| Do | Don't |
| --- | --- |
| Add `loading.tsx` for each route segment that has async data | Show a blank screen during navigation |
| Wrap async children in `<Suspense fallback={<Skeleton />}>` | Use `fallback={null}` on route-level Suspense — kills the visual scroll anchor under PPR |
| Add `error.tsx` for each route segment to catch render errors | Let errors bubble to the root error boundary |
| Add `not-found.tsx` for 404 states; call `notFound()` from a Server Component | Render a custom "404" component manually |
| Use route groups `(group)` for organisational nesting without affecting the URL | Add real path segments just to group files |
| Use `redirect()` from `next/navigation` in Server Components | Use `router.push()` in a `useEffect` for server-side redirects |

### Images & fonts
| Do | Don't |
| --- | --- |
| Use `next/image` with explicit `width` and `height` (or `fill` + sized parent) | Use bare `<img>` tags — you lose optimisation and CLS protection |
| Add `priority` to the LCP image (typically above the fold) | Mark every image `priority` — defeats the purpose |
| Load fonts via `next/font/google` or `next/font/local` with `display: "swap"` | Use `<link rel="stylesheet">` to Google Fonts directly |
| Expose fonts as CSS variables and wire them via `@theme inline` | Hardcode font-family in component styles |

### Code quality
| Do | Don't |
| --- | --- |
| Use `for...of` loops | Use `.forEach()` (Biome enforces `noForEach`) |
| Use early returns for guard clauses | Nest deeply with else chains |
| Keep files under ~300 lines, function complexity under 10 | Let files grow into 800-line god modules |
| Co-locate tests as `*.test.tsx` under `__tests__/` | Put tests in a top-level `tests/` folder far from the code |
| Reference fixtures from `__fixtures__/` in tests | Hardcode mock data inline in test files |
| Use Conventional Commits (`feat(web):`, `fix(ui):`) | Write freeform commit messages |
| Run `pnpm lint && pnpm type-check && pnpm test` before committing | Skip pre-commit checks or use `--no-verify` |
| Justify any `// biome-ignore` or `// @ts-expect-error` with a comment | Suppress lint or type errors silently |

### Security
| Do | Don't |
| --- | --- |
| Render user content as text (React escapes by default) | Use `dangerouslySetInnerHTML` |
| Store auth tokens in `httpOnly` cookies | Store tokens in `localStorage` or `sessionStorage` |
| Read secrets from server-only environment variables | Put secrets in `NEXT_PUBLIC_*` vars — they're bundled into the client |
| Import server vars via `env` from `src/config/env.ts` | Read `process.env.VAR` directly — bypasses validation and type safety |
| Import client vars via `clientEnv` from `src/config/client-env.ts` | Read `process.env.NEXT_PUBLIC_VAR` directly in components |
| Validate every Server Action and route handler input with Zod | Process unvalidated form/request data |
| Use `import "server-only"` at the top of files that must never reach the client | Assume a module won't be bundled just because it's only imported from server code |

## Architecture patterns

### Theming
Apps import a single theme file:
```css
@import "@ucmp/ui-theme/themes/default";
```
The theme imports base internally. To add a brand, copy `themes/default/`, edit `overrides/colors.css`, register the export in `packages/ui-theme/package.json`. See [`docs/THEMING.md`](docs/THEMING.md) for tokens and units (rem/px/em rules).

### Shadcn primitives, Base UI underneath
`@ucmp/ui` is shaped like shadcn (named exports `Dialog`, `DialogTrigger`, `DialogContent` …) but rendered with `@base-ui/react` primitives. The Base UI API uses dotted subcomponents internally and data attributes (`data-starting-style`, `data-ending-style`) for state styling. Components are installed via the official shadcn CLI with `style: "base-vega"` in `components.json`. The Button uses Base UI's `render` prop pattern (e.g. `<Button render={<Link href="..." />}>`) rather than `asChild`.

### Provider hierarchy (root layout)
```
ThemeProvider → QueryProvider → {children}
```
Use `composeProviders(...)` to flatten the nesting.

### Features = screaming architecture
Each subfolder of `apps/web/src/features/` is self-contained: `components/`, `hooks/`, `services/`, `data/`, `lib/`, `__tests__/`, `__fixtures__/`, `index.ts`. Only re-export from `index.ts` what other code should consume.

### Cache profiles (next.config.ts)

| Profile | Stale | Revalidate | Expire |
| --- | --- | --- | --- |
| `landing` | 15 min | 15 min | 1 hr |
| `profile` | 5 min | 10 min | 1 hr |
| `detail` | 5 min | 5 min | 1 hr |
| `search` | 5 min | 5 min | 1 hr |

Use via `cacheLife("landing")` inside a `"use cache"` function.

### Next 16 / React 19 / Tailwind 4 specifics

One-line guardrails for version-specific patterns. Deeper detail lives in the relevant skill files (see [Agent skills](#agent-skills)).

- **PPR (Partial Prerendering)** — Next 16's default rendering model. Everything outside `<Suspense>` becomes the static shell streamed from the CDN; wrap per-request data in `<Suspense fallback={<Skeleton />}>` to mark it as a dynamic hole.
- **Sync page + async leaf** — `page.tsx` default exports are **synchronous**. All `await` (data, `cookies()`, `headers()`, `params`, `searchParams`) lives in async leaf components wrapped in `<Suspense>`. Pass Promises down as props; the leaf awaits them. For siblings that share a fetch, create the promise in the page (no `await`) and unwrap with `use(promise)` in each Client Component leaf. See Vercel React Best Practices skill §1.6.
- **`proxy.ts`, not `middleware.ts`** — Next.js 16 renamed the file convention. Create `apps/web/proxy.ts` exporting `proxy(request)` (formerly `middleware(request)`) and use it only for auth, redirects, and rewrites — never for data fetching or per-route logic.
- **Metadata API** — export `const metadata` or `async function generateMetadata()` from a `page.tsx` or `layout.tsx`. Don't render `<title>` or `<meta>` tags by hand.
- **Tailwind 4 container queries** — use `@container` and `@sm:`/`@md:` variants when a component's layout should respond to its own width (sidebars, cards in flexible grids), not the viewport. Reach for breakpoints (`sm:`, `md:`) only for true page-level responsive design.

### Environment variables
- **Server vars** — import `env` from `src/config/env.ts`. Never read `process.env.VAR` directly in server code; the typed module validates at startup and keeps coerced types correct.
- **Client / public vars** (`NEXT_PUBLIC_*`) — import `clientEnv` from `src/config/client-env.ts`. Never read `process.env.NEXT_PUBLIC_VAR` directly; the Next.js bundler requires static property access which `client-env.ts` enforces.
- **`NEXT_PUBLIC_*`** — bundled into the client. Use only for non-sensitive values (analytics IDs, public API URLs, feature flag names).
- **All other vars** — server-only. Never log them; read them inside server code (Server Components, Server Actions, route handlers).
- Add **`import "server-only"`** at the top of any module that reads server secrets to guarantee a build error if it's ever imported from a Client Component.
- **`FEATURE_FLAG_*`** vars are the only accepted exception — assembled dynamically by the flags SDK and cannot be statically enumerated in the schema.

## Naming & commits

- **Files & folders**: kebab-case (`landing.tsx`, `use-debounce.ts`, `alert-dialog.tsx`, `features/vehicle-card/`)
- **Components**: PascalCase exports (`Landing`, `AlertDialog`)
- **Hooks**: `use-*.ts` files with `useFoo` exports
- **Utilities, services, Server Actions**: camelCase exports (`formatPrice`, `getVehicle`, `submitFormAction`)
- **Types & Zod schemas**: PascalCase types (`Vehicle`), camelCase schemas with `Schema` suffix (`vehicleSchema`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Next.js App Router reserved files**: lowercase (`page.tsx`, `layout.tsx`, `proxy.ts`, …)
- **Commits**: Conventional Commits — `feat(web):`, `fix(ui):`, `refactor(ui-theme):`, `test(web):`, `chore(monorepo):`. Scopes: `web`, `ui`, `ui-theme`, `shared`, `config`, `monorepo`.

Full file-kind table, the 17 reserved Next.js file names, and route segment patterns (`[id]`, `[...slug]`, `(group)`, `_folder`, `@slot`, `(.)`/`(..)`/`(...)`) live in [`docs/NAMING.md`](docs/NAMING.md).

Everything else (line width, quotes, semicolons, import sorting, type-only imports, `noForEach`, etc.) is enforced by Biome via Ultracite — `pnpm fix` auto-corrects.

## Testing

- **Framework**: Vitest 4 + jsdom 29
- **Libraries**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Globals**: `describe`, `it`, `expect`, `vi` available without imports
- **Import test utils** from `@ucmp/vitest-config/test-utils`
- **Co-locate tests** under `__tests__/`, fixtures under `__fixtures__/`

## Implementation workflow

See [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — read context, plan, types first, fixtures, service, component, tests, document, validate, fill the PR template.

## Reference docs

| Topic | Document |
| --- | --- |
| Architecture deep dive | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Branches, commits, PRs, Definition of Done | [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) |
| Implementation workflow | [`docs/WORKFLOW.md`](docs/WORKFLOW.md) |
| Performance budgets & Core Web Vital targets | [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) |
| Security rules | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Theming, tokens & unit rules (rem/px/em) | [`docs/THEMING.md`](docs/THEMING.md) |
| Figma → Tailwind token mapping (spacing, typography, colors, radii) | [`docs/FIGMA-TOKEN-MAPPING.md`](docs/FIGMA-TOKEN-MAPPING.md) |
| Naming conventions (full file-kind table + Next.js reserved files + route segments) | [`docs/NAMING.md`](docs/NAMING.md) |
| Architecture Decision Records | [`docs/adr/`](docs/adr/) |
| PR template / Return Contract | [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) |
| Verification agent prompt | [`.kiro/prompts/verify-pr.md`](.kiro/prompts/verify-pr.md) |
| Common issues and fixes | [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) |

> Before answering questions about runtime errors, SSL issues, build failures, or environment problems, read `docs/TROUBLESHOOTING.md`.

## Agent skills

This repo ships with agent skills in `.agents/skills/` (universal) and `.claude/skills/` (Claude Code). They cover Next.js patterns, Cache Components, shadcn, Vitest, monorepo management, component design, React 19 patterns, web design guidelines, and more.

```bash
npx skills experimental_install   # restore after a fresh clone
npx skills update                 # pull latest versions
```
