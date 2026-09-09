# Landing feature

Example of the **screaming architecture** feature-module shape used everywhere under `src/features/`.

```
features/landing/
├── components/       # React components owned by this feature
│   └── landing.tsx
├── hooks/            # Feature-scoped hooks (use-landing-*.ts)
├── services/         # Data-fetching, API clients, server actions
├── data/             # Mock data, types specific to this feature
├── lib/              # Pure helpers, formatters, parsers
├── __tests__/        # Co-located unit / component tests
├── index.ts          # Public surface — only re-export what other code may use
└── README.md         # Short note on what this feature owns
```

## Rules of the road

1. **Public surface is `index.ts`.** Only re-export the components, hooks, and types that other features or the route layer (`app/`) should consume. Everything else stays internal.
2. **No cross-feature imports of internals.** Feature A should not reach into `feature B/components/internal-thing.tsx` — only `import { Thing } from "@features/b"`.
3. **Reach into shared, never down.** A feature can import from `@shared/*`, `@config/*`, `@layout/*`, and the packages — but never from `apps/web/src/app/*`.
4. **Co-locate tests.** `__tests__/foo.test.tsx` sits next to the file it tests.
5. **Empty subfolders are okay.** Keep the shape consistent even if a feature doesn't use `services/` yet — it makes navigation predictable.

## Client boundary conventions

Next.js `'use client'` directives should live on the **smallest interactive leaf** — the component that actually calls React hooks or browser APIs. Presentational children that merely receive props (callbacks, data) from a client parent do **not** need their own `'use client'` because they inherit the client boundary from the parent import tree.

**Guideline:** Only add `'use client'` when a file directly:
- Calls React hooks (`useState`, `useEffect`, `useRef`, custom hooks, etc.)
- Accesses browser-only APIs (`window`, `document`, `navigator`, `localStorage`, etc.)
- Uses client-only libraries that cannot run in a server module graph

Files that are pure UI (props in → JSX out) should omit the directive so they remain eligible for server compilation when imported outside a client subtree.

## Adding a new feature

```bash
mkdir -p apps/web/src/features/your-feature/{components,hooks,services,data,lib,__tests__}
touch apps/web/src/features/your-feature/{index.ts,README.md}
```

Then re-export the public surface from `index.ts` and consume via `@features/your-feature`.
