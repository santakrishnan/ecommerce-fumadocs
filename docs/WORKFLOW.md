# Implementation workflow

The order AI agents (and humans) should follow when implementing a feature or ticket in this repo. Designed for spec-driven development where each story has a typed contract.

## Before writing code

1. **Read context.** Open [`AGENTS.md`](../AGENTS.md) and the relevant feature `README.md` (e.g. `apps/web/src/features/<feature>/README.md`) before touching files.
2. **Plan.** Identify Server vs Client boundaries. Write a one-paragraph plan in the PR description before creating files.

## While building

3. **Types first.** Generate TypeScript interfaces for the data shape. Components consume typed props, not API calls directly — this is what makes them resilient to API changes.
4. **Fixtures second.** Create happy-path, empty/null, and error fixtures under `@features/<feature>/__fixtures__/`. Tests reference these — never inline mock data.
5. **Service / fetcher.** Implement the data fetcher under `@features/<feature>/services/`. Server fetchers use `"use cache"` with the appropriate `cacheLife()` profile.
6. **Component.** Implement the component using `@ucmp/ui` primitives and `@ucmp/ui-theme` tokens. Follow the Do/Don't rules in `AGENTS.md`.
7. **Tests.** Write Vitest tests referencing fixtures. Cover Server Action Zod rejection, success and error branches, and any race conditions.

## Before opening a PR

8. **Document the component (shadcn-style).** For new public components, add a JSDoc block with an `@example` showing typical usage. For non-trivial composites, add a short usage block to the feature's `README.md`.
9. **Validate everything.**
   ```bash
   pnpm type-check && pnpm lint && pnpm test && pnpm build
   ```
10. **Fill the PR template.** [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) auto-populates on every PR — complete every section.

## What "done" looks like

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full Definition of Done checklist.

## Naming convention for render-boundary clarity

When a component split is non-obvious, use suffixes to make boundaries visible in imports:

- `PurchaseRailServer` — Server Component
- `SaveButtonClient` — Client Component (uses `onClick`, state, or browser APIs)
- `PurchaseRailSkeleton` — Suspense fallback / loading skeleton

Most components don't need suffixes — only use them where the split matters and could confuse a reader.
