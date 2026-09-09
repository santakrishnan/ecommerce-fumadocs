# ADR-0001: App Router structure, search URL strategy, VDP path, and cache profile mapping

| | |
| --- | --- |
| **Status** | Proposed |
| **Date** | 2026-05-12 |
| **Authors** | WS1- Leads team |
| **Stakeholders** | Engineering, Product, SEO, Analytics, Backend |
| **Supersedes** | — |
| **Superseded by** | — |

## 1. Context

Batch 1 design defines a buyer journey with four distinct page experiences:

1. **Anonymous landing** — first-time visitor sees the marketing home page.
2. **Returning-visitor welcome** — visitors identified by a long-lived cookie whose first visit was more than 2 hours ago land on a personalized "welcome back" page that replaces (not augments) the home page.
3. **Modern AI-style search** — a dedicated search route with a ChatGPT-like input UX, where each submitted query becomes a shareable, persistent URL.
4. **Vehicle Detail Page (VDP)** — deep SEO-friendly URL reached by direct navigation from search results.

Additional constraints:

- **Framework**: Next.js 16 App Router, React Compiler ON, Tailwind v4.
- **Page transitions**: Adopt Next.js View Transitions API.
- **Search ID source**: the backend search service generates a UUID per search and returns it with the initial result set. The frontend does not invent IDs.
- **Existing SEO precedent**: Adopt URP pattern `/used-cars/<make>/<model>/<trim>/<year>/<vin>` style URLs. Marketing wants to preserve the depth-of-path SEO signal.
- **Scaffolding constraints**: `apps/web/next.config.ts` already defines four `cacheLife` profiles — `landing`, `profile`, `detail`, `search`.

This ADR proposes a route structure, caching strategy, and transition pattern that scales as we add `(account)`, `(admin)`, dealer notes, garage, favorites, and other batches.

## 2. Decisions

### D1. Route groups by audience

Organise top-level segments into route groups that reflect intent, not URL structure:

```
app/
├── (marketing)/        # anonymous + returning-visitor funnel
├── (shop)/             # search + VDP — the buying flow
└── (future: (account)/, (admin)/, …)
```

Route groups have **no URL effect**. They keep files organized by ownership, make code review boundaries clearer, and let us add per-audience layouts (auth gates, analytics scopes) later without renaming URLs.

### D2. Cookie-based welcome redirect via `proxy.ts`

Next.js 16 renames `middleware.ts` to `proxy.ts`. It handles two routing concerns:

1. **Redirect `/` → `/welcome`** when the visitor's first visit was more than 2 hours ago (returning visitor).
2. **Guard `/welcome` → `/`** when the visitor doesn't have valid tracking cookies or hasn't passed the 2-hour threshold (prevents direct access / stale bookmarks).

```ts
// apps/web/proxy.ts (simplified)
import { NextResponse, type NextRequest } from "next/server";

const RETURNING_VISITOR_THRESHOLD_MS = 2 * 3_600_000; // 2 hours

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/" && pathname !== "/welcome") return NextResponse.next();

  const sessionId = request.cookies.get("_ucmp_session_id")?.value;
  const firstVisitAt = Number(request.cookies.get("_ucmp_first_visit_at")?.value);

  const isReturning =
    Boolean(sessionId) &&
    Number.isFinite(firstVisitAt) &&
    Date.now() - firstVisitAt > RETURNING_VISITOR_THRESHOLD_MS;

  // `/` — redirect returning visitors to `/welcome`
  if (pathname === "/" && isReturning) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  // `/welcome` — bounce non-returning visitors back to `/`
  if (pathname === "/welcome" && !isReturning) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // First visit to `/` — stamp cookies so the threshold clock starts
  if (pathname === "/") {
    const response = NextResponse.next();
    if (!sessionId) {
      response.cookies.set("_ucmp_session_id", crypto.randomUUID(), { maxAge: 90 * 86_400 });
    }
    if (!Number.isFinite(firstVisitAt)) {
      response.cookies.set("_ucmp_first_visit_at", String(Date.now()), { maxAge: 30 * 86_400 });
    }
    return response;
  }

  return NextResponse.next();
}
```

**Key design choices:**

- **Redirect (307), not rewrite**: the URL must change so `/welcome` is shareable, bookmarkable, and analytics-distinct. 307 is correct because the redirect is conditional/per-user — search crawlers (no cookies) always see the landing page.
- **`FIRST_VISIT_AT` (not `LAST_VISIT_AT`)**: the cookie records when the visitor first arrived and is never updated. The 2-hour threshold counts from that single origin point — repeat visits within the window don't reset the clock.
- **Cookie stamping happens in `proxy.ts`**: no external tracking pipeline dependency. Cookies are set on the first visit to `/` and read on subsequent requests.
- **Two TTLs, two concerns**: `RETURNING_VISITOR_THRESHOLD` (2 hours) controls when the redirect fires. `RETURNING_VISITOR` (30 days) controls the cookie's `maxAge` / expiry — after 30 days the cookie disappears and the user becomes "new" again.
- **Guard on `/welcome`**: prevents users from bookmarking or sharing `/welcome` in a way that bypasses the cookie check. Visitors without valid cookies get bounced to `/`.

### D3. Rendering pattern: synchronous page, async leaves

**Every `page.tsx` default export is synchronous.** All `await` calls — for data fetches, `cookies()`, `headers()`, route `params`, `searchParams` — live in **async leaf components** wrapped in `<Suspense>`. Promises are passed down as props; they are never awaited at the page level. This is the canonical Next.js 16 + Vercel guidance and matches the pattern already in production in the prior ecommerce codebase.

```tsx
// ❌ Don't — async page blocks the static shell from rendering
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);                      // every byte waits for the fetch
  return <Layout><DataView data={data} /></Layout>;
}

// ✅ Do — sync page, await happens in the leaf
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Layout>
      <Suspense fallback={<DataSkeleton />}>
        <DataView paramsPromise={params} />            {/* pass the promise, don't await */}
      </Suspense>
    </Layout>
  );
}

async function DataView({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const data = await getData(id);
  return <DataContent data={data} />;
}
```

**Why it matters:**
- The static shell (page chrome, headers, footers, Suspense fallbacks) renders synchronously and streams from the CDN immediately — best possible TTFB.
- Multiple async leaves race in parallel under their own `<Suspense>` boundaries.
- Page exports stay composable; `async` doesn't leak into the route contract.

**Promise-passing variants:**
- **Pass the `params` Promise itself** down to the leaf (preferred — what `apps/web/src/app/(main)/used-cars/[[...params]]/page.tsx` does in the prior codebase).
- For data fetches reused by sibling components, **create the promise in the page (no `await`) and pass it to multiple leaves that unwrap with `use(promise)`** — single fetch, shared across siblings (see Vercel React Best Practices §1.6 alternative).

**References**:
- Next.js 16 official docs — [Fetching data → Streaming with Suspense](https://nextjs.org/docs/app/getting-started/fetching-data#streaming) — explicit "Don't await the data fetching function" guidance.
- [`.agents/skills/vercel-react-best-practices/AGENTS.md`](../../.claude/skills/vercel-react-best-practices/AGENTS.md) §1.6 "Strategic Suspense Boundaries" (Vercel Engineering, Jan 2026).
- Internal precedent: `apps/web/src/app/(main)/used-cars/[[...params]]/page.tsx` and `(home-experience)/(home-personalized)/home-authenticated/page.tsx` in the prior ecommerce-web codebase both ship this pattern in production.

This decision applies to every subsequent page-level decision (D4, D5, D7, D8).

### D4. Anonymous home: `/` (static)

`app/(marketing)/page.tsx` — fully static, cached with `cacheLife("landing")` (15-minute stale window). Sync export.

### D5. Welcome page: `/welcome` with parallel personalization slot

```
app/(marketing)/welcome/
├── layout.tsx
├── page.tsx                      # static shell (hero, marketing modules)
└── @personalization/
    ├── page.tsx                  # personalized recommendations
    ├── loading.tsx               # skeleton (NOT fallback={null})
    └── default.tsx               # required slot fallback
```

The shell is static and streams from the CDN as part of PPR. Per **D3**, the slot's `page.tsx` is **sync** — it just wraps the async leaf in `<Suspense>`. The leaf reads cookies *outside* any `"use cache"` scope, then passes the visitor id into a cached fetcher keyed on that id:

```tsx
// app/(marketing)/welcome/@personalization/page.tsx — SYNC
import { Suspense } from "react";
import { Recommendations } from "@features/welcome/components/recommendations";
import { RecsSkeleton } from "@features/welcome/components/recs-skeleton";

export default function PersonalizationSlot() {
  return (
    <Suspense fallback={<RecsSkeleton />}>
      <Recommendations />
    </Suspense>
  );
}
```

```tsx
// @features/welcome/components/recommendations.tsx — async leaf
import { cookies } from "next/headers";
import { getRecommendations } from "../services/recommendations.service";
import { RecsList } from "./recs-list";

export async function Recommendations() {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value ?? "anon";
  const data = await getRecommendations(visitorId);    // pass visitorId, not cookies
  return <RecsList items={data} />;
}
```

```ts
// @features/welcome/services/recommendations.service.ts
"use cache";
import { cacheLife, cacheTag } from "next/cache";

export async function getRecommendations(visitorId: string) {
  cacheLife("profile");          // 5-min stale, 10-min revalidate
  cacheTag(`recs:${visitorId}`);
  const res = await fetch(`${API}/recommendations?vid=${visitorId}`);
  return res.json();
}
```

### D6. Search input: `/search`

`app/(shop)/search/page.tsx` — static input page with an AI-style query field. Submission goes to a Server Action.

### D7. Search results: `/search/<uuid>` (Option A — backend-generated UUID)

The Server Action calls the backend search service, which returns a UUID plus the initial result set. We `redirect()` to `/search/<uuid>`. The UUID is the persistent share key.

```ts
// @features/search/actions/submit-search.actions.ts
"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSearch } from "../services/search.service";

const submitSearchSchema = z.object({ query: z.string().min(1).max(500) });

export async function submitSearchAction(formData: FormData) {
  const parsed = submitSearchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error };

  const { id } = await createSearch(parsed.data.query);
  redirect(`/search/${id}`);
}
```

```
app/(shop)/search/[id]/
├── page.tsx                      # "use cache" keyed on id
├── loading.tsx
└── error.tsx
```

```tsx
// app/(shop)/search/[id]/page.tsx — SYNC, passes params Promise to leaf
import { Suspense } from "react";
import { SearchResults } from "@features/search/components/search-results";
import { SearchResultsSkeleton } from "@features/search/components/search-results-skeleton";

interface Props {
  params: Promise<{ id: string }>;
}

export default function SearchResultsPage({ params }: Props) {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResults paramsPromise={params} />
    </Suspense>
  );
}
```

```tsx
// @features/search/components/search-results.tsx — async leaf
import { getSearchResults } from "../services/search.service";
import { SearchResultsList } from "./search-results-list";

export async function SearchResults({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  const results = await getSearchResults(id);
  return <SearchResultsList data={results} />;
}
```

```ts
// @features/search/services/search.service.ts
"use cache";
import { cacheLife, cacheTag } from "next/cache";

export async function getSearchResults(id: string) {
  cacheLife("search");           // 5-min stale, 5-min revalidate
  cacheTag(`search:${id}`);
  const res = await fetch(`${API}/searches/${id}`);
  return res.json();
}
```

**Why UUID over canonical-query hash:**
- Backend already generates it — no client logic needed.
- Search records can carry server-side metadata (user context, ranking notes) that don't appear in the URL.
- New queries always get fresh results (no surprise cache hits from a 3-day-old run of the same query).
- Trade-off accepted: identical queries from two users do not share a cache key. Backend can deduplicate at the data layer if needed.

### D8. VDP: `/used-cars/details/<make>/<model>/<trim>/<year>/<vin>`

Deep, SEO-friendly URL preserving the precedent set by the prior codebase. Named segments (not catch-all) give us typed params and explicit URL contracts.

```
app/(shop)/used-cars/details/[make]/[model]/[trim]/[year]/[vin]/
├── page.tsx
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

```tsx
// page.tsx — SYNC, passes params Promise to leaf
import { Suspense } from "react";
import { Vdp } from "@features/vdp/components/vdp";
import { VdpSkeleton } from "@features/vdp/components/vdp-skeleton";

type Params = Promise<{
  make: string;
  model: string;
  trim: string;
  year: string;
  vin: string;
}>;

export default function VdpPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<VdpSkeleton />}>
      <Vdp paramsPromise={params} />
    </Suspense>
  );
}
```

```tsx
// @features/vdp/components/vdp.tsx — async leaf
import { notFound } from "next/navigation";
import { getVehicle } from "../services/vehicle.service";
import { VdpContent } from "./vdp-content";

type VdpParams = { make: string; model: string; trim: string; year: string; vin: string };

export async function Vdp({ paramsPromise }: { paramsPromise: Promise<VdpParams> }) {
  const { vin } = await paramsPromise;
  const vehicle = await getVehicle(vin);    // cache keyed on vin only
  if (!vehicle) notFound();
  return <VdpContent vehicle={vehicle} />;
}
```

```ts
// @features/vdp/services/vehicle.service.ts
"use cache";
import { cacheLife, cacheTag } from "next/cache";

export async function getVehicle(vin: string) {
  cacheLife("detail");
  cacheTag(`vehicle:${vin}`);
  const res = await fetch(`${API}/vehicles/${vin}`);
  if (res.status === 404) return null;
  return res.json();
}
```

**VIN is the canonical cache key.** Make/model/trim/year are SEO sugar derived from the vehicle record. We do not cache by the composite path — that would multiply cache entries for the same vehicle (e.g. a trim spelling correction would invalidate nothing useful).

**Canonicalisation guard**: in `generateMetadata`, validate that `<make>/<model>/<trim>/<year>` match the vehicle's actual values. If not, `redirect()` to the canonical URL. This protects against URL hand-edits and stale outbound links.

### D9. View Transitions at the root layout

Clicking a result card on `/search/<uuid>` navigates directly to the full VDP page. View Transitions provide the smooth visual continuity between routes — no modal interception.

```tsx
// app/layout.tsx
import { unstable_ViewTransition as ViewTransition } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ViewTransition>{children}</ViewTransition>
      </body>
    </html>
  );
}
```

**Three guardrails** (recorded from prior incidents):

1. **Consistent Suspense boundaries**. Mixing `<Suspense>` and non-Suspense children inside `<ViewTransition>` causes hydration mismatch. Every dynamic region must be wrapped in `<Suspense>`.
2. **No `fallback={null}` on route-level Suspense.** Under PPR this removes the visual scroll anchor and breaks scroll-to-top on navigation. Always use a skeleton.
3. **Do NOT set `html { scroll-behavior: smooth }`.** Breaks App Router scroll reset under PPR + streaming.

### D10. Cache profile mapping (just for Reference)

| Route | Cache directive | Profile (TTL) | Cache key | Invalidation tag |
| --- | --- | --- | --- | --- |
| `/` | `"use cache"` (page) | `landing` (15m stale / 15m revalidate / 1h expire) | none | `marketing-home` |
| `/welcome` shell | none (static + PPR) | n/a | n/a | n/a |
| `/welcome` personalization slot | `"use cache"` (fetcher) | `profile` (5m / 10m / 1h) | `visitorId` | `recs:${visitorId}` |
| `/search` | static (no cache directive needed) | n/a | n/a | n/a |
| `/search/<uuid>` | `"use cache"` (fetcher) | `search` (5m / 5m / 1h) | `id` | `search:${id}` |
| `/used-cars/details/.../<vin>` | `"use cache"` (fetcher) | `detail` (5m / 5m / 1h) | `vin` | `vehicle:${vin}` |

Profile names (`landing`, `profile`, `detail`, `search`) already match this design — no `next.config.ts` change required.

**Invalidation paths** (`POST /api/revalidate` endpoint, secret-protected - For Reference):
- A vehicle status change → `revalidateTag("vehicle:${vin}", "max")`
- A user action that should refresh recommendations → `revalidateTag("recs:${visitorId}", "max")`
- A search becoming stale (e.g. inventory drift) → `revalidateTag("search:${id}", "max")`

## 3. Final route tree

All `page.tsx` exports below are **sync** per D3. Async work lives in feature leaves wrapped in `<Suspense>`.

```
apps/web/
├── proxy.ts                                          # D2: cookie redirect
└── src/app/
    ├── layout.tsx                                    # D9: ViewTransitions wrapper
    ├── error.tsx
    ├── not-found.tsx
    ├── global-error.tsx
    │
    ├── (marketing)/
    │   ├── page.tsx                                  # D4: /
    │   └── welcome/
    │       ├── layout.tsx
    │       ├── page.tsx                              # D5: /welcome shell
    │       └── @personalization/
    │           ├── page.tsx                          # D3 + D5: sync, wraps <Recommendations />
    │           ├── loading.tsx
    │           └── default.tsx
    │
    └── (shop)/
        ├── search/
        │   ├── page.tsx                              # D6: /search
        │   └── [id]/
        │       ├── page.tsx                          # D3 + D7: sync, passes params to <SearchResults />
        │       ├── loading.tsx
        │       └── error.tsx
        └── used-cars/
            └── details/
                └── [make]/[model]/[trim]/[year]/[vin]/
                    ├── page.tsx                      # D3 + D8: sync, passes params to <Vdp />
                    ├── loading.tsx
                    ├── error.tsx
                    └── not-found.tsx
```

## 4. Feature module layout

Each route's business logic lives in a self-contained feature module:

```
apps/web/src/features/
├── landing/                  # owns the / page UI
├── welcome/                  # owns /welcome + personalization fetcher
├── search/                   # owns /search input + /search/[id] results
└── vdp/                      # owns the vehicle detail page
```

Each module follows the screaming-architecture rule: `components/`, `hooks/`, `services/`, `actions/`, `data/`, `lib/`, `__tests__/`, `__fixtures__/`, `index.ts` (public surface).

## 5. Consequences

### Positive

- **SEO-aligned URLs** for VDP preserve marketing's keyword density and outbound-link patterns from the prior codebase.
- **Shareable search URLs** with persistent UUIDs match the ChatGPT-style UX and enable analytics on share-driven traffic.
- **PPR + streaming** delivers a fast static shell to every route; personalization streams in without blocking the LCP.
- **Cache hits at the unique-id layer** (uuid for search, vin for VDP) maximise cache reuse across user sessions.
- **Route groups** keep the file tree understandable as we add `(account)`, `(admin)`, etc., without URL churn.
- **View Transitions** provide smooth search → VDP navigation feel without the complexity of intercepted parallel routes.

### Negative / accepted trade-offs
- **View Transitions hydration sensitivity** — every dynamic region must be in a `<Suspense>`. Costs one design rule but produces a measurably better navigation feel.

## 6. References

- Next.js App Router file conventions — https://nextjs.org/docs/app/api-reference/file-conventions
- Next.js View Transitions — https://nextjs.org/docs/app/guides/view-transitions
- Next.js Partial Prerendering — https://nextjs.org/docs/app/guides/partial-prerendering
- Next.js `"use cache"` directive — https://nextjs.org/docs/app/api-reference/directives/use-cache
- Next.js `proxy.ts` — https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- Project guardrails: [`AGENTS.md`](../../AGENTS.md), [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md), [`docs/PERFORMANCE.md`](../PERFORMANCE.md), [`docs/THEMING.md`](../THEMING.md)
