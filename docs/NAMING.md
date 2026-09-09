# Naming conventions

Follows the **shadcn/ui + Next.js App Router** convention: file names are kebab-case; the exported symbol inside follows its kind. This file is the lookup reference — the high-level rule lives in [`AGENTS.md`](../AGENTS.md).

## Files & exported symbols

| Kind | File | Exported symbol |
| --- | --- | --- |
| Component | `landing.tsx`, `alert-dialog.tsx`, `radio-group.tsx` | `Landing`, `AlertDialog`, `RadioGroup` (PascalCase) |
| Hook | `use-debounce.ts`, `use-media-query.ts` | `useDebounce`, `useMediaQuery` (camelCase, `use*` prefix) |
| Utility | `formatters.ts`, `validators.ts`, `slugify.ts` | `formatPrice`, `isEmail`, `slugify` (camelCase) |
| Type / interface module | `types.ts`, `vehicle.ts` | `Vehicle`, `SearchParams`, `UserRole` (PascalCase) |
| Zod schema | `schemas.ts`, `<feature>.schema.ts` | `vehicleSchema`, `loginSchema` (camelCase with `Schema` suffix) |
| Constants module | `constants.ts` | `API_BASE_URL`, `MAX_RESULTS` (UPPER_SNAKE_CASE) |
| Service / fetcher | `vehicle.service.ts`, `search.service.ts` | `getVehicle`, `searchVehicles` (camelCase) |
| Server Action | `<feature>.actions.ts` | `submitFormAction`, `deleteItemAction` (`*Action` suffix) |
| Test | `<file>.test.ts(x)` co-located in `__tests__/` | n/a |
| Fixture | `<feature>.fixtures.ts` in `__fixtures__/` | `vehicleFixture`, `emptyVehicleFixture` |
| Folder | `vehicle-card/`, `my-garage/`, `features/landing/` | n/a |

## Next.js App Router reserved files

These names are reserved by Next.js — they are case-sensitive, lowercase, and must be used exactly as shown:

| File | Purpose |
| --- | --- |
| `page.tsx` | Route segment's UI (makes the segment publicly accessible) |
| `layout.tsx` | Shared UI wrapping a segment and its children |
| `loading.tsx` | Automatic `<Suspense>` fallback for the segment |
| `error.tsx` | Error boundary for the segment (must be a Client Component) |
| `not-found.tsx` | UI rendered when `notFound()` is called or no route matches |
| `global-error.tsx` | Error boundary for the root layout (catches root-level errors) |
| `template.tsx` | Like `layout.tsx` but re-renders on navigation (no shared state) |
| `default.tsx` | Fallback for parallel routes that have no match |
| `route.ts` | Server-side route handler (GET, POST, etc. for `app/api/*`) |
| `proxy.ts` | Edge proxy / middleware (renamed from `middleware.ts` in Next.js 16) |
| `instrumentation.ts` | One-time server-startup hook (e.g. OpenTelemetry registration) |
| `sitemap.ts` | Generates `/sitemap.xml` |
| `robots.ts` | Generates `/robots.txt` |
| `manifest.ts` | Generates the web app manifest |
| `opengraph-image.tsx` | Generates Open Graph images for the segment |
| `icon.tsx` | Generates favicons / app icons |
| `apple-icon.tsx` | Generates Apple touch icons |

## Route segment patterns

| Pattern | Meaning | Example |
| --- | --- | --- |
| `[id]` | Dynamic segment — matches a single path part | `app/posts/[id]/page.tsx` → `/posts/42` |
| `[...slug]` | Catch-all — matches all remaining segments | `app/docs/[...slug]/page.tsx` → `/docs/a/b/c` |
| `[[...slug]]` | Optional catch-all — also matches the parent path | `app/[[...slug]]/page.tsx` → `/`, `/a`, `/a/b` |
| `(group)` | Route group — organisational only, doesn't appear in the URL | `app/(marketing)/about/page.tsx` → `/about` |
| `_folder` | Private folder — excluded from routing | `app/_internal/utils.ts` (not routable) |
| `@slot` | Parallel route slot — renders alongside `children` | `app/@modal/page.tsx` |
| `(.)`, `(..)`, `(...)` | Intercepting routes — replace another route's UI in-place | `app/feed/(..)photo/[id]/page.tsx` |

## Commits

Conventional Commits with these scopes:

- `web` — `apps/web`
- `ui` — `packages/ui`
- `ui-theme` — `packages/ui-theme`
- `shared` — `packages/shared`
- `config` — `packages/config/*`
- `monorepo` — root config, turbo, biome, husky

Examples:

```
feat(web): add settings feature module
fix(ui): correct dialog backdrop animation
refactor(ui-theme): split semantic colors out of overrides
chore(monorepo): bump turbo to 2.8
```

## Folder shape for a feature

```
features/<feature-name>/
├── components/         # PascalCase exports, kebab-case files
├── hooks/              # use-*.ts files, useFoo exports
├── services/           # *.service.ts files, camelCase function exports
├── actions/            # *.actions.ts files, *Action function exports
├── data/               # static data, JSON fixtures
├── lib/                # feature-internal helpers
├── __tests__/          # *.test.ts(x) files
├── __fixtures__/       # *.fixtures.ts files
├── types.ts            # feature types
├── schemas.ts          # Zod schemas
└── index.ts            # public surface — only re-export what others should import
```

Anything *not* re-exported from `index.ts` is private to the feature.
