import "server-only";

/**
 * BED service client — the one sanctioned way to call a Toyota BED service.
 *
 * ## Layering (low → high)
 * - `createServerClient` — the generic transport primitive: retries, timeout,
 *   `X-Trace-Id`, schema validation, interceptors. Knows nothing about BED.
 * - `createBedClient` (this file) — a thin wrapper over `createServerClient`
 *   that adds the BED **auth + identity contract** on top. It is not a second
 *   client; it is `createServerClient` with the BED headers pre-wired.
 *
 * ## When to use which
 * - **Calling a BED service** (visitors, search, …) resolved via
 *   `resolveBedService()` → use **`createBedClient`**. It guarantees the
 *   per-service `X-API-Key`, the shared `X-Tenant-Id`, and (when supplied)
 *   `X-Visitor-Id` / `X-Session-Id`, so no call site can forget them.
 * - **Calling a non-BED upstream** (a third-party API, a host with different
 *   auth) or needing bespoke headers the BED contract doesn't cover → use
 *   **`createServerClient` directly**.
 * - Do **not** hand-set `X-API-Key` / `X-Tenant-Id` on a raw
 *   `createServerClient` pointed at a BED host — that is exactly what this
 *   wrapper prevents. The "slight header difference" is intentional and is the
 *   wrapper's whole purpose.
 *
 * Note: the remaining legacy per-feature factories (`createGeoClient`,
 * `createSearchClient`, …) predate this and call `createServerClient` *without*
 * the BED headers; they are being consolidated onto `createBedClient` — the
 * profile/visitors client (`createProfileClient`) was the first migrated.
 */

import type { ResolvedBedService } from "@config/bed-services";
import { ORIGIN_VERIFY_HEADER, originVerifyHeader } from "./origin-verify";
import { createServerClient } from "./server-api";
import type { ServerClient } from "./types";

/** BED authenticates each service call with a per-service key on this header. */
export const BED_API_KEY_HEADER = "X-API-Key";
/** Multi-tenant selector sent to every BED service. */
export const BED_TENANT_HEADER = "X-Tenant-Id";
/** Canonical visitor id (from VSF `/resolve`) forwarded to every BED service. */
export const BED_VISITOR_HEADER = "X-Visitor-Id";
/** Active session id (from VSF `/resolve`) forwarded to every BED service. */
export const BED_SESSION_HEADER = "X-Session-Id";

/* API Key to allow external network entry into APIs */
export const BED_EXTERNAL_VERIFY_HEADER = ORIGIN_VERIFY_HEADER;

/**
 * Visitor identity resolved by the Visitor Profile Service (`/resolve`).
 *
 * Read from the identity cookies via `readVisitorIdentity()` and handed to
 * `createBedClient` so every downstream BED call (search, profile, …) carries
 * the same `X-Visitor-Id` / `X-Session-Id`.
 */
export interface BedVisitorIdentity {
  sessionId?: string | null;
  visitorId?: string | null;
}

/**
 * Build BED service headers from resolved service and visitor identity.
 *
 * Returns headers with `X-Tenant-Id` (when service.tenantId is present),
 * `X-Visitor-Id` (ONLY when identity?.visitorId is truthy), and
 * `X-Session-Id` (ONLY when identity?.sessionId is truthy).
 *
 * Anonymous/unresolved visitors result in NO visitor headers — this enforces
 * the BED-service migration requirement to omit X-Visitor-Id and X-Session-Id
 * rather than using crypto.randomUUID() or fallback values.
 *
 * NOTE: This does NOT include `X-API-Key` — that header is managed differently
 * in createBedClient (via createServerClient's apiKey option) vs raw fetch
 * calls (via the returned headers). Use `buildBedHeadersWithApiKey` when you
 * need X-API-Key in the returned map for SSE streams or other raw fetch usage.
 */
export function buildBedHeaders(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (service.tenantId) {
    headers[BED_TENANT_HEADER] = service.tenantId;
  }
  if (identity?.visitorId) {
    headers[BED_VISITOR_HEADER] = identity.visitorId;
  }
  if (identity?.sessionId) {
    headers[BED_SESSION_HEADER] = identity.sessionId;
  }

  return headers;
}

/**
 * Build BED service headers including the X-API-Key header.
 *
 * Same as `buildBedHeaders` but includes `X-API-Key` in the returned map.
 * Use this variant for SSE streams or other raw fetch calls that need all
 * headers in a single Record<string, string>.
 */
export function buildBedHeadersWithApiKey(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): Record<string, string> {
  const headers = buildBedHeaders(service, identity);
  headers[BED_API_KEY_HEADER] = service.apiKey;
  return headers;
}

/**
 * Create a server HTTP client for a resolved BED service.
 *
 * Wires the per-service `X-API-Key` (via the client's built-in `apiKey`
 * support), the shared `X-Tenant-Id`, and — when a `identity` is supplied —
 * the visitor's `X-Visitor-Id` / `X-Session-Id`. `X-Trace-Id` (a fresh UUID),
 * `Accept`, and `Content-Type` are already set by `createServerClient`, so
 * every BED call is authenticated, identified, and traceable without per-call
 * boilerplate.
 *
 * Kept synchronous and cookie-free so it is safe to call inside a `"use cache"`
 * scope — read the identity outside the cache boundary and pass it in.
 */
export function createBedClient(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): ServerClient {
  const defaultHeaders: Record<string, string> = {
    ...buildBedHeaders(service, identity),
    ...originVerifyHeader(),
  };

  return createServerClient({
    baseUrl: service.baseUrl,
    serviceName: service.serviceName,
    apiKey: { headerName: BED_API_KEY_HEADER, value: service.apiKey },
    defaultHeaders: Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined,
  });
}
