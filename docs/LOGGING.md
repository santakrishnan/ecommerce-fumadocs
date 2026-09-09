# Logging Strategy

> **Status**: Active  
> **ADR**: [`docs/adr/structured-logging-strategy.md`](adr/structured-logging-strategy.md)

This document defines when, where, and how to log in the ecommerce-web monorepo. It is the forward-looking standard for all new code; existing ad-hoc `console.*` usage should be migrated per the [Migration Checklist](#migration-checklist) below.

---

## Table of contents

- [Guiding principles](#guiding-principles)
- [Architecture: server vs. client](#architecture-server-vs-client)
- [The standard logger: `createLogger`](#the-standard-logger-createlogger)
- [Log levels](#log-levels)
- [Scope naming convention](#scope-naming-convention)
- [When to log](#when-to-log)
- [Well-known structured fields](#well-known-structured-fields)
- [Client-side error reporting (planned)](#client-side-error-reporting)
- [Why not OpenTelemetry today?](#why-not-opentelemetry-today)
- [Migration checklist](#migration-checklist)

---

## Guiding principles

1. **Log at boundaries** — external API calls, infrastructure interactions (DB, cache, CDN), and user-facing error paths are where logs add the most value.
2. **Structured by default** — every log entry is a JSON line in production. Human-readable formatting is dev-only.
3. **Levels convey severity, not verbosity** — pick the level that matches the operational response (ignore, investigate, or wake someone up).
4. **Never log secrets or PII** — the logger does not redact anything automatically, so this is on the caller. When in doubt, hash or omit.
5. **Server is the source of truth** — Vercel captures server-side stdout/stderr. Client-side logs are best-effort supplementary signals.

---

## Architecture: server vs. client

Server-side logging gets the full structured standard (`createLogger`); client-side gets a lightweight, best-effort error reporter. This keeps the client bundle light and treats server logs as the queryable source of truth, at the cost of client errors being less structured.

**Server-side logging (this doc, below) is implemented today.** Client-side error reporting is a planned addition — see [Client-side error reporting](#client-side-error-reporting). The table below describes the target design for both tiers; only the `Server` column reflects what exists in code right now.

| Concern | Server (implemented) | Client (planned, not yet implemented) |
|---------|--------|--------|
| Standard | `createLogger` (mandatory) | Best-effort error reporter |
| Output | JSON lines → stdout/stderr → Vercel Log Drains | Server Action `reportClientError` |
| Levels | `debug \| info \| warn \| error \| fatal` | `error` only (via reporter) |
| Enforcement | `import "server-only"` prevents accidental client import | Reporter is opt-in from error boundaries |

### Why server-first?

Vercel captures all server-side `console.*` output out of the box and makes it queryable via Log Drains (Datadog, Axiom, etc.). Client-side logs have no automatic pipeline — they need an explicit transport. By keeping the structured standard server-side, we get immediate value without infrastructure work.

---

## The standard logger: `createLogger`

**Location**: `apps/web/src/shared/lib/logger.ts`

```ts
import { createLogger } from "@shared/lib/logger";

const log = createLogger("search:api");

log.info("query executed", { query, durationMs: 42, resultCount: 10 });
log.warn("upstream degraded", { url, status: 503 });
log.error("unrecoverable failure", { requestId, message: err.message });
log.fatal("connection pool exhausted — process terminating", { pool: "primary" });
log.debug("cache key computed", { key, segments }); // suppressed in production by default
```

### Output format

**Production** (JSON line):
```json
{"scope":"search:api","message":"query executed","timestamp":"2026-08-12T10:00:00.000Z","query":"sedan","durationMs":42,"resultCount":10}
```

**Development** (human-readable):
```
[search:api] query executed {"query":"sedan","durationMs":42,"resultCount":10}
```

---

## Log levels

| Level | Meaning | When to use | Operational response |
|-------|---------|-------------|---------------------|
| `debug` | Detailed diagnostic info | Cache hits/misses, computed keys, timing breakdowns, query params | None — dev/incident use only |
| `info` | Normal operational events | Request completed, action succeeded, feature flag resolved | None — audit trail |
| `warn` | Degraded but recoverable | Upstream returned 5xx but fallback worked, missing optional config | Investigate if recurring |
| `error` | Failed and user-impacting | Unhandled exception caught, external dependency unreachable, 500 returned | Investigate promptly |
| `fatal` | Process-terminating or on-call-worthy | Connection pool exhausted, critical secret missing at startup, OOM imminent | Wake someone up |

### `fatal` usage constraints

`fatal` is reserved for situations where the process cannot continue or the system is in a state that requires immediate human intervention. Examples:

- Required database connection cannot be established at startup
- Critical secret (e.g. signing key) is missing and the server cannot serve any request safely
- Unrecoverable resource exhaustion

If the server can still serve other requests (even if this one failed), use `error`.

### Level suppression

Controlled by the `LOG_LEVEL` environment variable with a sensible default:

| `LOG_LEVEL` value | Levels printed | Default when |
|-------------------|----------------|--------------|
| `debug` | all | — (opt-in) |
| `info` | info, warn, error, fatal | `NODE_ENV !== "production"` |
| `warn` | warn, error, fatal | — |
| `error` | error, fatal | — |
| `fatal` | fatal only | — |
| _(unset)_ | info+ in dev/test, info+ in prod | Default behavior |

Override in production for temporary incident debugging:
```bash
LOG_LEVEL=debug vercel env pull  # or set in Vercel dashboard
```

---

## Scope naming convention

Format: **`feature:submodule`** (colon-separated, feature-first)

```ts
createLogger("fingerprint:geo")
createLogger("fingerprint:enrich")
createLogger("media:proxy")
createLogger("search:api")
createLogger("search:cache")
createLogger("compare:service")
createLogger("auth:session")
```

Rules:
- Use the feature folder name as the first segment
- Use the submodule/file purpose as the second segment
- Keep it short — this appears in every log line
- For shared utilities: `createLogger("shared:http")`, `createLogger("shared:cache")`

This convention enables prefix-based filtering in log aggregators: `scope:fingerprint:*` shows all fingerprint-related logs.

---

## When to log

### Principles

1. **Log at every external boundary crossing** — HTTP calls out, database queries, cache interactions, third-party SDK calls.
2. **Log every caught error** — even if handled gracefully, the fact that it happened is valuable for trend analysis.
3. **Don't log the happy path in detail** — a single `info` confirming success is enough. Save `debug` for the breakdown.
4. **Never log inside tight loops** — if something happens 1000x/request, log a summary after the loop.
5. **Include enough context to reproduce** — requestId, relevant IDs, durations.

### Prescriptive reference table

| Situation | Required? | Level | Example context fields |
|-----------|-----------|-------|----------------------|
| External API call failure | Must | `error` | `{ url, method, status, durationMs }` |
| External API call success | Should | `debug` | `{ url, method, status, durationMs }` |
| Server Action input validation failure | May | `warn` | `{ action, field, reason }` |
| Unrecoverable server error | Must | `error` | `{ requestId, message, stack? }` |
| Process-terminating failure | Must | `fatal` | `{ reason, resource }` |
| Cache miss / revalidation | May | `debug` | `{ key, hit, ttlMs }` |
| Feature flag evaluation | May | `debug` | `{ flag, value, reason }` |
| Auth failure (invalid token) | Should | `warn` | `{ reason, ip? (hashed) }` |
| Slow operation (> threshold) | Should | `warn` | `{ operation, durationMs, threshold }` |
| Startup / config loaded | Should | `info` | `{ configKeys: [...] }` |

**Must** = always emit. **Should** = emit unless you have a good reason not to. **May** = useful for debugging, not required.

---

## Well-known structured fields

Use these field names when applicable — they enable consistent log aggregator dashboards and alerts:

| Scenario | Recommended fields |
|----------|--------------------|
| HTTP calls (outbound) | `url`, `method`, `status`, `durationMs` |
| HTTP requests (inbound) | `path`, `method`, `status`, `durationMs`, `requestId` |
| User/session context | `visitorId` (hashed if PII), `sessionScope` |
| Cache events | `key`, `hit` (boolean), `ttlMs` |
| Errors | `message`, `code`, `stack` (debug only), `requestId` |
| Feature flags | `flag`, `value`, `reason` |
| Performance | `operation`, `durationMs`, `threshold` |

Rules:
- Keep values flat (no nested objects) — log aggregators handle flat JSON best
- Use `camelCase` for field names
- Timestamps are handled by the logger — don't add your own
- Use `durationMs` (not `duration`, `time`, `elapsed`) for consistency

---

## Client-side error reporting

> **Status**: Planned — not yet implemented. Out of scope for the current branch. This section documents the target design so it can be built and consumed consistently once picked up; there is no `reportClientError` action in the codebase today.

Once built, client-side errors that need server-side visibility will go through a `reportClientError` Server Action:

```ts
// app/actions/report-client-error.ts
"use server";

import { createLogger } from "@shared/lib/logger";

const log = createLogger("client:error");

interface ClientErrorReport {
  message: string;
  stack?: string;
  componentName?: string;
  url?: string;
  userAgent?: string;
}

export async function reportClientError(report: ClientErrorReport) {
  log.error("client error reported", {
    message: report.message,
    componentName: report.componentName,
    url: report.url,
    // stack is debug-level detail — only include a truncated version
    stackPreview: report.stack?.slice(0, 200),
  });

  return { success: true };
}
```

### Usage in error boundaries

```tsx
"use client";

import { reportClientError } from "@/app/actions/report-client-error";

export function ErrorBoundaryFallback({ error, reset }) {
  useEffect(() => {
    reportClientError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
    });
  }, [error]);

  return <ErrorFallbackUI onRetry={reset} />;
}
```

### What NOT to report from the client

- User input values (form data, search queries with PII)
- Auth tokens or session identifiers
- High-frequency events (scroll, resize, animation frame errors)

---

## Why not OpenTelemetry today?

OpenTelemetry (OTel) is the industry standard for distributed tracing, metrics, and logs. Here's why we're not adopting it now, and when we would:

| Consideration | `createLogger` (current) | OpenTelemetry |
|---------------|--------------------------|---------------|
| Setup complexity | Zero — 80 lines, no deps | Significant — SDK, exporters, collectors |
| Bundle impact | None (server-only) | Moderate (even server-side adds deps) |
| Vercel integration | Native (stdout → Log Drains) | Supported via `@vercel/otel` but adds config |
| Distributed tracing | Not supported | Core feature — trace across services |
| Metrics (histograms, counters) | Not supported | Core feature |
| Cost | Free | Requires a backend (Datadog, Honeycomb, etc.) |
| Learning curve | Minimal | Moderate — spans, contexts, propagation |

### When to revisit

Consider adopting OTel when any of these become true:
- The system grows to multiple independently deployed services that need cross-service trace correlation
- You need histograms, percentile latency tracking, or custom metrics beyond what Vercel Analytics provides
- An observability backend (Datadog, Honeycomb) is already in the stack and you want unified instrumentation

### Migration path

If/when OTel is adopted, `createLogger` becomes a thin wrapper that emits OTel log records instead of raw JSON lines. The consumer API (`log.info(...)`) stays identical — no code changes needed outside the logger internals.

---

## Migration checklist

For converting existing `console.*` calls to `createLogger`:

1. **Identify the file's feature scope** — what feature folder does it belong to?
2. **Choose a scope name** — `"feature:submodule"` format (see [Scope naming](#scope-naming-convention))
3. **Create the logger** — `const log = createLogger("feature:submodule");` at module top
4. **Replace each `console.*` call**:
   - `console.log(msg)` → `log.info(msg)` or `log.debug(msg)`
   - `console.warn(msg)` → `log.warn(msg)`
   - `console.error(msg)` → `log.error(msg)`
5. **Add structured context** — convert string interpolation to data objects:
   ```ts
   // Before
   console.error(`Failed to fetch ${url}: ${err.message}`);
   // After
   log.error("fetch failed", { url, message: err.message });
   ```
6. **Verify `import "server-only"`** — the file must be server-only (or the logger import will fail at build time)
7. **Remove the old import** — delete `console.*` usage entirely

---

## Reference

| Topic | Link |
|-------|------|
| Logger source | `apps/web/src/shared/lib/logger.ts` |
| ADR | [`docs/adr/structured-logging-strategy.md`](adr/structured-logging-strategy.md) |
| Vercel Log Drains | [Vercel docs](https://vercel.com/docs/observability/log-drains) |
| Security rules | [`docs/SECURITY.md`](SECURITY.md) |
