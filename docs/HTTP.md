# HTTP utility — `@shared/lib/http`

A small, opinionated HTTP wrapper around `fetch()` that gives every feature
**one** consistent way to call APIs — from Server Components, route handlers,
Server Actions, and from the browser.

> Source: [`apps/web/src/shared/lib/http/`](../apps/web/src/shared/lib/http/)
> Tests:  [`apps/web/src/shared/lib/http/__tests__/`](../apps/web/src/shared/lib/http/__tests__/)

---

## TL;DR

```ts
// Server
import { createServerClient } from "@shared/lib/http";

const api = createServerClient({
  baseUrl: process.env.API_URL!,
  authToken: process.env.API_TOKEN,
  serviceName: "VDP",
});

const vehicle = await api.get<Vehicle>(`/vehicles/${vin}`, {
  next: { revalidate: 300, tags: [`vehicle:${vin}`] },
  schema: VehicleSchema,
});
```

```ts
// Browser
import { createHttpClient } from "@shared/lib/http";

const client = createHttpClient(ids, headerMap, { baseUrl: "/api" });
const result = await client.post("/events/track", payload, { encrypt: true });
```

---

## Why this exists

Every feature needs to call an API and every feature was solving the same six
problems in subtly different ways: retries, timeouts, query strings, headers,
error shapes, schema validation. This utility centralises those concerns:

| Concern | Handled by |
| --- | --- |
| Auth header (Bearer / API key) | `authToken`, `apiKey` config — string or function for rotation |
| Tracking headers (session, fingerprint, profile id) | `headerMap` + per-request `ids` |
| Retries on flaky upstreams | Idempotent-method-only by default + `Retry-After` + jitter |
| Timeouts | `AbortController` composed with caller's `signal` |
| Query strings | `params` option with array-repeat + nullish skip |
| Body type | JSON, FormData, Blob, URLSearchParams, ReadableStream — auto-detected |
| Response validation | `schema` option (Zod / Valibot / ArkType) |
| Error shape | `ServerHttpError` / `ClientHttpError` with `status`, `code`, `body`, `cause` |
| Encryption (sensitive payloads) | `encrypt: true` → JWE (A256KW + A256GCM) |
| Next.js fetch extensions | `cache`, `next: { revalidate, tags }` |
| Observability hooks | `onRequest` / `onResponse` / `onError` interceptors |
| Server vs browser separation | Two factories (`createServerClient`, `createHttpClient`), `import "server-only"` on the server module |

---

## When to use which client

| You are in… | Use |
| --- | --- |
| Server Component, route handler, Server Action, server-side service | `createServerClient` |
| Client Component, hook, browser event handler | `createHttpClient` |

`createServerClient` is **server-only** — importing it from a Client Component
will fail at build time (`server-only` guard). That's intentional: the server
client may carry secrets (Bearer tokens, internal API keys) that must never
ship to the browser bundle.

`createHttpClient` is universal in principle but is shaped for browser-side
use (cookie-based session via `credentials: "include"`, JWE encryption with
`NEXT_PUBLIC_ENCRYPTION_KEY`).

---

## BED service client (`createBedClient`)

For **Toyota BED services** — the shared backend at `API_UPSTREAM_URL`
(visitors, search, …) — prefer `createBedClient` over calling
`createServerClient` directly. It is a thin wrapper that pre-wires the BED
**auth + identity contract**, so no call site can forget a required header. It
is *not* a second client; it is `createServerClient` with the BED headers
pre-applied.

```ts
import { createBedClient, readVisitorIdentity } from "@shared/lib/http";
import { resolveBedService } from "@config/bed-services";

// 1. Resolve config: shared domain + versioned path + per-service key.
const visitors = resolveBedService("visitors");   // null when unconfigured → fall back to mocks
if (!visitors) return mock;

// 2. Read the visitor identity OUTSIDE any "use cache" scope; pass it in.
const identity = await readVisitorIdentity();      // { visitorId, sessionId } from cookies

// 3. Every call now carries the BED headers automatically.
const client = createBedClient(visitors, identity);
const raw = await client.post("/resolve", { deviceFingerprintHash });
//  → POST {API_UPSTREAM_URL}/visitors/v1/resolve
//    with X-API-Key, X-Tenant-Id, X-Visitor-Id, X-Session-Id, X-Trace-Id
```

### What it adds over `createServerClient`

| Header | Source |
| --- | --- |
| `X-API-Key` | per-service key (`VISITORS_API_KEY`, `SEARCH_API_KEY`, …) |
| `X-Tenant-Id` | shared `BED_TENANT_ID` |
| `X-Visitor-Id` / `X-Session-Id` | the `identity` arg (from `readVisitorIdentity()`) |
| `X-Trace-Id` | fresh UUID (already set by `createServerClient`) |

`createBedClient` is kept **synchronous and cookie-free** so it is safe inside
a `"use cache"` scope — read the identity outside the cache boundary and pass
it as an argument.

### The service registry (`@config/bed-services`)

One shared domain; each service adds its own versioned path prefix and key:

```
API_UPSTREAM_URL=https://api.sandbox.arrow.toyotafinancial.com   # shared domain
VISITORS_API_PATH=/visitors/v1   VISITORS_API_KEY=…              # per service
SEARCH_API_PATH=/search/v1       SEARCH_API_KEY=…
BED_TENANT_ID=…                                                  # shared tenant
```

`resolveBedService(name)` composes `${API_UPSTREAM_URL}${*_API_PATH}` and
returns `{ serviceName, baseUrl, apiKey, tenantId }`, or `null` when the domain
or the service's key is missing (callers fall back to mocks). Add an endpoint →
call another path; bump a version → change `*_API_PATH`; onboard a service →
add a registry entry + its env vars. No hard-coded upstream URLs in
`bff/services/*`.

### When to use which

| Calling… | Use |
| --- | --- |
| A BED service via `resolveBedService()` (visitors, search, …) | **`createBedClient`** |
| A non-BED upstream, or you need bespoke headers | **`createServerClient`** directly |

Never hand-set `X-API-Key` / `X-Tenant-Id` on a raw `createServerClient` aimed
at a BED host — that is exactly what `createBedClient` exists to prevent. The
legacy per-feature factories (`createGeoClient`, `createSearchClient`, …) still
call `createServerClient` without these headers and are being consolidated onto
`createBedClient`; the profile/visitors client was the first migrated.

### Migrated onto the BED contract

- **Search results** (`POST /api/v1/search` → `getSearchResults` →
  `fetchSearchUpstream`) now resolve via `resolveBedService("search")` +
  `createBedClient`, posting to `SEARCH_ENDPOINTS.results`. The old
  `ARROW_SEARCH_API_URL` / `ARROW_SEARCH_API_KEY` transport and the
  `crypto.randomUUID()` visitor-id fallback are gone — identity is read from
  cookies and omitted when the visitor is anonymous.
- **Smart filters** (`POST /api/v1/filters` → `getFilters` →
  `fetchFiltersUpstream`) now resolve via `resolveBedService("search")` +
  `createBedClient`, posting to `SEARCH_ENDPOINTS.filters`. Same pattern:
  no more `ARROW_SEARCH_*` transport or `crypto.randomUUID()` fallback.
- **Conversational agent v2** (`agent-v2-upstream.ts`) resolves the same
  `search` service and builds its SSE-stream headers with `buildBedHeaders`
  (the raw-`fetch` sibling of `createBedClient`, exported alongside it) plus
  `buildBedHeadersWithApiKey` for the `X-API-Key`. No more hardcoded tenant or
  `FALLBACK_VISITOR_ID`.

> **`buildBedHeaders` / `buildBedHeadersWithApiKey`** — use these when a caller
> cannot use `createBedClient` because it needs a raw `fetch` (e.g. SSE
> streaming). They apply the identical omit-when-absent identity rules.

---

## Server client

### Create

```ts
// @features/vdp/services/vehicle.service.ts
import "server-only";
import { createServerClient } from "@shared/lib/http";

export const vdpApi = createServerClient({
  baseUrl: process.env.API_URL!,
  authToken: () => getAccessToken(),         // function = re-evaluated per attempt
  apiKey: { headerName: "X-Api-Key", value: process.env.API_KEY! },
  serviceName: "VDP",
  defaultCache: "no-store",                  // Next 16 explicit; override per request
  retries: 2,
  retryDelay: 300,
  headerMap: { sessionId: "X-Session-Id", profileId: "X-Profile-Id" },
});
```

### Read

```ts
// inside an async leaf component
const vehicle = await vdpApi.get<Vehicle>(`/vehicles/${vin}`, {
  next: { revalidate: 300, tags: [`vehicle:${vin}`] },
  cache: "force-cache",
  schema: VehicleSchema,                     // Zod, Valibot, ArkType — anything with `.parse`
  ids: { sessionId, profileId },             // injected via headerMap
  signal: caller.signal,                     // composed with the timeout signal
  timeout: 8_000,
});
```

### Write

```ts
// Server Action
const created = await vdpApi.post<SavedDeal>("/deals", deal, {
  schema: SavedDealSchema,
  idempotent: true,                          // allow retry of this POST (has idempotency key)
});
```

### Inside a `"use cache"` function

```ts
"use cache";
import { cacheLife, cacheTag } from "next/cache";

export async function getVehicle(vin: string) {
  cacheLife("detail");
  cacheTag(`vehicle:${vin}`);
  // Pass cache: "no-store" so the wrapper doesn't add a second cache layer
  // beneath "use cache" — "use cache" is the only cache we want for this path.
  return vdpApi.get<Vehicle>(`/vehicles/${vin}`, { cache: "no-store", schema: VehicleSchema });
}
```

> `cookies()`, `headers()`, `searchParams` must be read **outside** any
> `"use cache"` scope, and passed in as arguments. Apply the same rule to
> tracking IDs: extract them once at the route boundary, pass them down.

---

## Browser client

### Create

```ts
// @features/welcome/hooks/use-tracking-client.ts
import { createHttpClient } from "@shared/lib/http";

export function useTrackingClient(ids: TrackingIds) {
  return createHttpClient(
    ids,
    { sessionId: "X-Session-Id", fingerprintId: "X-Fp-Id" },
    { baseUrl: "/api", retries: 1, retryDelay: 300 },
  );
}
```

### Use

```ts
const client = useTrackingClient(ids);

await client.post<TrackResult>("/events/track", payload, {
  encrypt: true,                             // JWE body, sets X-Encrypted: true
  schema: TrackResultSchema,
  idempotent: true,
});
```

### One-off `fetch` with just tracking headers

```ts
import { buildTrackingHeaders } from "@shared/lib/http";

const response = await fetch("/api/health", {
  headers: buildTrackingHeaders(ids, { sessionId: "X-Session-Id" }),
});
```

---

## Option matrix

### `ServerClientConfig` / `ClientConfig`

| Option | Server | Browser | Default | What it does |
| --- | :---: | :---: | --- | --- |
| `baseUrl` | required | optional | `""` | Prepended to every request path. Absolute paths (`http://…`) bypass it. |
| `authToken` | ✅ | — | — | Bearer token. Accepts `string` or `() => string \| Promise<string>` for rotation. |
| `apiKey` | ✅ | — | — | `{ headerName, value }`. Value accepts the same `TokenProvider` shape as `authToken`. |
| `credentials` | — | ✅ | `"include"` | Forwarded to `fetch()`. Set to `"omit"` for public reads. |
| `defaultCache` | ✅ | — | `"no-store"` | Next 16 explicit cache mode applied to every request unless overridden. |
| `defaultHeaders` | ✅ | ✅ | — | Headers merged into every request. |
| `headerMap` | ✅ | ✅ | `{}` | `{ trackingKey: "Header-Name" }` mapping. |
| `interceptors` | ✅ | ✅ | — | `onRequest`, `onResponse`, `onError` hooks. |
| `retries` | ✅ | ✅ | `2` / `1` | Max additional attempts beyond the initial request. |
| `retryDelay` | ✅ | ✅ | `300` ms | Base for exponential backoff. |
| `retryStatuses` | ✅ | ✅ | `[0, 408, 425, 429, 500–599]` | Override the retryable status set. |
| `serviceName` | ✅ | — | `"API"` | Label used in logs and `ServerHttpError.service`. |
| `timeout` | ✅ | ✅ | `15_000` / `30_000` ms | Per-request timeout (composed via `AbortSignal.any`). |

### `ServerRequestOptions<T>` / `ClientRequestOptions<T>`

| Option | Server | Browser | What it does |
| --- | :---: | :---: | --- |
| `cache` | ✅ | — | Override `defaultCache` per request. |
| `credentials` | — | ✅ | Override default per request. |
| `encrypt` | — | ✅ | JWE-encrypt the body. JSON-shaped bodies only. |
| `headers` | ✅ | ✅ | Per-request headers (override `defaultHeaders`). |
| `idempotent` | ✅ | ✅ | Allow retry of `POST` / `PATCH`. Use only when the endpoint is safe to re-invoke (idempotency key, naturally idempotent semantics). |
| `ids` | ✅ | — | Tracking IDs to inject via `headerMap`. Browser client takes `ids` at factory creation. |
| `next` | ✅ | — | `{ revalidate, tags }` forwarded to Next.js `fetch`. |
| `params` | ✅ | ✅ | Query string. Arrays repeat the key. `null` / `undefined` skipped. |
| `retries` | ✅ | ✅ | Override the client-level `retries`. |
| `schema` | ✅ | ✅ | Validate the parsed JSON via `{ parse(unknown): T }`. Failures throw `SCHEMA_VALIDATION` with the original error in `.cause`. |
| `signal` | ✅ | ✅ | Caller's `AbortSignal`, composed with the timeout signal. |
| `timeout` | ✅ | ✅ | Per-request timeout override. |

---

## Retry policy

```text
Retryable statuses : 0 (network/timeout), 408, 425, 429, 500–599
Retryable methods  : GET, HEAD, OPTIONS, PUT, DELETE
                     (POST, PATCH only when opts.idempotent === true)
Delay              : Retry-After when present (seconds or HTTP-date)
                     else exp backoff: retryDelay * 2^attempt * (0.5 + Math.random() * 0.5)
Max attempts       : 1 + retries (initial + retries)
```

A 502 on a `POST /orders` that actually committed could create duplicates if
we naively retried it — so the wrapper retries `POST` / `PATCH` only when you
explicitly mark them as idempotent. Common ways to make a `POST` idempotent:

- Backend accepts an `Idempotency-Key` header (Stripe / Square style).
- The endpoint is naturally idempotent (e.g. "mark notification as seen").
- The endpoint is wrapped in a server-side dedup window.

If none of those apply, accept the failure and surface it to the caller.

---

## Schema validation

Pass any schema that exposes `parse(unknown): T`. Zod, Valibot, and ArkType
all match without an adapter.

```ts
import { z } from "zod";

const VehicleSchema = z.object({
  vin: z.string().length(17),
  year: z.number().int(),
  make: z.string(),
  model: z.string(),
});

const vehicle = await api.get(`/vehicles/${vin}`, { schema: VehicleSchema });
//    ^? z.infer<typeof VehicleSchema>
```

On validation failure the wrapper throws a structured error with the original
issue chain preserved on `.cause`:

```ts
try {
  await api.get(`/vehicles/${vin}`, { schema: VehicleSchema });
} catch (err) {
  if (err instanceof ServerHttpError && err.code === "SCHEMA_VALIDATION") {
    observability.report(err, { cause: err.cause });   // ZodError chain
  }
  throw err;
}
```

---

## Error contract

```ts
class ServerHttpError extends Error {
  status:  number;       // HTTP status, or 0 for transport/timeout
  code:    string;       // "HTTP_404" | "TIMEOUT" | "NETWORK_ERROR" | "SCHEMA_VALIDATION" | server-supplied
  service: string;       // configured serviceName
  body?:   unknown;      // parsed JSON or raw text from the error response
  cause?:  unknown;      // original error (TimeoutError, ZodError, …)
  isRetryable: boolean;
  toJSON(): HttpErrorJSON;
}
```

`ClientHttpError` is identical minus `service`.

```ts
try {
  await api.get("/x");
} catch (err) {
  if (err instanceof ServerHttpError) {
    if (err.status === 404)              return notFound();
    if (err.code === "TIMEOUT")          return showSlowMessage();
    if (err.code === "NETWORK_ERROR")    return showOfflineMessage();
    if (err.code === "SCHEMA_VALIDATION") return showStaleClientMessage();
  }
  throw err;
}
```

---

## Interceptors

```ts
import { createServerClient } from "@shared/lib/http";

const api = createServerClient({
  baseUrl: process.env.API_URL!,
  interceptors: {
    onRequest: (ctx) => {
      ctx.headers.set("X-Trace-Id", crypto.randomUUID());
    },
    onResponse: (response, ctx) => {
      metrics.histogram("http.duration_ms", performance.now() - ctx.start);
    },
    onError: (error, ctx) => {
      observability.report(error, { url: ctx.url, attempt: ctx.attempt });
    },
  },
});
```

`onRequest` runs **on every attempt** — including retries — so it's the
right place to attach fresh tokens, generate trace IDs, or count attempts.

Interceptors must not throw. Any exception inside an interceptor is swallowed
so it cannot break the request loop.

---

## Body types

| Body type | Treatment |
| --- | --- |
| `undefined` / `null` | No body sent |
| Plain object / array / scalar | `JSON.stringify(body)`, Content-Type `application/json` |
| `string` | Passed through; Content-Type left to the caller |
| `FormData` | Passed through; runtime sets the multipart boundary |
| `URLSearchParams` | Passed through |
| `Blob`, `ArrayBuffer`, `ArrayBufferView`, `ReadableStream` | Passed through |

```ts
const form = new FormData();
form.append("photo", file);
await client.post("/upload", form);                    // no Content-Type header — boundary added by browser
```

---

## Query strings

```ts
await api.get("/vehicles", {
  params: {
    make: "Toyota",
    year: 2024,
    tag: ["new", "certified"],                         // ?tag=new&tag=certified
    soldOut: null,                                     // skipped
    page: undefined,                                   // skipped
  },
});
```

The wrapper preserves any existing `?` already in `path`, so this works:

```ts
await api.get("/search?source=home", { params: { q: "civic" } });
// → /search?source=home&q=civic
```

---

## Encryption (browser → server)

Set `encrypt: true` on a write to JWE-encrypt the body. JSON-shaped payloads
only (FormData / Blob throw `ENCRYPTION_INVALID_BODY`).

```ts
// browser
await client.post("/events/track", payload, { encrypt: true });
```

```ts
// server route handler — accepts optionally-encrypted bodies
import { decryptRequestPayload } from "@shared/lib/http";

export async function POST(request: NextRequest) {
  const data = await decryptRequestPayload<EventPayload>(request);
  // …
}
```

**Setup**

1. Generate a 32-byte (AES-256) key and Base64url-encode it.
2. Set `ENCRYPTION_KEY` (server) AND `NEXT_PUBLIC_ENCRYPTION_KEY` (browser).
3. The browser key is bundled into the client — treat it as **integrity, not
   confidentiality**. The threat model is "make casual tampering / accidental
   logging painful", not "protect against a determined attacker who owns the
   client".

---

## Tracking headers

The server-side helpers complete the round trip:

```ts
// route handler
import { extractTrackingIds, decodeCookieValue } from "@shared/lib/http";

const ids = extractTrackingIds(
  request,
  { sessionId: "X-Session-Id", profileId: "X-Profile-Id" },
  { sessionId: "_session", profileId: "_profile" },
  decodeCookieValue,
);
```

Header values win over cookies; the literal value `"anonymous"` is skipped so
a placeholder header doesn't shadow a real cookie.

---

## Sealed cookies

```ts
import { buildCookieConfig, encodeCookieValue } from "@shared/lib/http";

const config = buildCookieConfig("session", 30 * 86_400);
// dev:  { name: "session",        secure: false, … }
// prod: { name: "__Host-session", secure: true,  … }

response.cookies.set({ ...config, value: encodeCookieValue(sessionId) });
```

`__Host-` is enforced in production. The codec uses `TextEncoder` + `btoa` —
universal between Node and browsers, no Node `Buffer` dependency.

---

## Anti-patterns

- ❌ **Awaiting at the page level.** Pages stay synchronous; pass `Promise<T>`
  to an async leaf wrapped in `<Suspense>`. The HTTP client is called from the
  leaf, not the page.
- ❌ **Calling `cookies()` / `headers()` inside `"use cache"`.** Read them at
  the route boundary, then pass plain values into the cached function.
- ❌ **Catching `ServerHttpError` only to log and re-throw** without adding
  context. Either handle it, attach a richer message via `cause`, or let it
  bubble.
- ❌ **Mocking the wrapper in tests.** Mock `fetch` (or the upstream) and let
  the wrapper run — its retry / schema / error behaviour is part of what
  you're testing.
- ❌ **`retries: 5` on every endpoint.** Tight retry loops amplify outages.
  Default is fine; raise per-service only when there's a known transient.
- ❌ **`POST` with `idempotent: true` because "it usually works".** Only set
  it when the endpoint is provably safe to invoke twice.
- ❌ **Hardcoding tracking header names in services.** Define the `headerMap`
  once at client-creation time; pass `ids` per request.

---

## Testing

Use `vi.stubGlobal("fetch", fetchMock)` and respond with `new Response(…)` —
the wrapper itself stays unmocked so the test exercises retries / schema /
errors as they ship.

```ts
const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);

fetchMock
  .mockResolvedValueOnce(new Response("boom", { status: 503 }))
  .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  }));

const client = createServerClient({ baseUrl: "https://api.test", retries: 1, retryDelay: 1 });
await expect(client.get("/x")).resolves.toEqual({ ok: true });
expect(fetchMock).toHaveBeenCalledTimes(2);
```

See [`__tests__/server-api.test.ts`](../apps/web/src/shared/lib/http/__tests__/server-api.test.ts) for a full reference set.

---

## Cheatsheet

```ts
// One-liner reads
await api.get<User>("/me");
await api.get<Vehicle>(`/vehicles/${vin}`, { schema: VehicleSchema });

// Reads with caching + tagging
await api.get<Vehicle>(`/vehicles/${vin}`, {
  next: { revalidate: 300, tags: [`vehicle:${vin}`] },
  cache: "force-cache",
});

// Writes
await api.post<Created>("/x", body);                              // no retry
await api.post<Created>("/x", body, { idempotent: true });        // retried like a GET

// Long-running cancellable
const ac = new AbortController();
api.get("/big", { signal: ac.signal, timeout: 60_000 });
ac.abort();

// Browser with credentials override
client.get("/public", { credentials: "omit" });

// Encrypted browser write
client.post("/events", payload, { encrypt: true });
```
