# Performance targets

Budgets and Core Web Vital targets for `apps/web`. These are the numbers reviewers will check before approving a perf-sensitive PR.

## Core Web Vitals

| Metric | Target | What it measures |
| --- | --- | --- |
| LCP | < 1.8s | Largest Contentful Paint — when the main content is visible |
| CLS | < 0.05 | Cumulative Layout Shift — visual stability during load |
| INP | < 200ms | Interaction to Next Paint — how snappy interactions feel |

## Lighthouse targets

| Category | Target |
| --- | --- |
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| SEO | ≥ 90 |

## Component and bundle budgets

| Budget | Threshold |
| --- | --- |
| Per-component render | < 100ms |
| Per-route segment bundle | Flag if > 20 KB gzipped |

## Practical rules

- **Server-render whenever possible.** Client JS is the most expensive resource — every `"use client"` ships bytes and delays interactivity.
- **Use `"use cache"`** for any server-side data that isn't truly per-request. Pair with `cacheLife()` and `cacheTag()`.
- **Stream with Suspense.** Wrap slow data fetches in `<Suspense>` boundaries so the static shell renders immediately (Partial Prerendering — PPR).
- **No layout shift.** Reserve space for images (`width`/`height`), skeletons for async content, and `min-h-*` for content that changes size on hydrate.
- **Reduce motion.** Every animation must have a `prefers-reduced-motion` fallback (handled by Tailwind's `motion-safe:` / `motion-reduce:` variants or Framer Motion's `useReducedMotion()`).
- **Profile before optimizing.** React Compiler handles memoization. Only add manual optimization when a profile shows a real bottleneck.

## How to verify

- Run Lighthouse against a production build (`pnpm build && pnpm start`).
- Check the Next.js build output for per-route bundle sizes (`pnpm build` prints a route summary).
- Use the React DevTools Profiler to find slow renders.
