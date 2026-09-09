import "server-only";
import { env } from "./env";

/**
 * BED (backend) service registry.
 *
 * Every BED service lives under one shared domain (`API_UPSTREAM_URL`) but has
 * its own **versioned path prefix** and its own **API key**. This registry is
 * the single place that composition happens, so adding an endpoint, bumping a
 * version, or onboarding a new service is a data change here — never a new
 * base-URL string scattered across a `bff/services/*` file.
 *
 * Each entry in `BED_SERVICES` holds typed accessor functions (`apiKey`, `path`)
 * that read directly from the validated `env` module — no string key lookups or
 * unsafe casts. The accessors are evaluated lazily at call time, which also
 * keeps `vi.stubEnv()` working in tests without `vi.resetModules()`.
 *
 * Example resolved base URL for `visitors`:
 *   API_UPSTREAM_URL           = https://api.sandbox.arrow.toyotafinancial.com
 *   VISITORS_API_PATH          = /visitors/v1
 *   → baseUrl                  = https://api.sandbox.arrow.toyotafinancial.com/visitors/v1
 *   client.post("/resolve")    → …/visitors/v1/resolve
 *
 * To add an endpoint:  call another path on the same client (`/suggestions`).
 * To bump a version:   set `VISITORS_API_PATH=/visitors/v2` — no code change.
 * To add a service:    add an entry below + declare its vars in `env-schema.ts`.
 */

const LEADING_SLASHES = /^\/+/;
const TRAILING_SLASHES = /\/+$/;

export type BedServiceName =
  | "visitors"
  | "search"
  | "vehicle-detail"
  | "geo"
  | "origination"
  | "origination-identity"
  | "origination-tradein";

interface BedServiceDefinition {
  /** Returns this service's API key from the typed env module. */
  apiKey: () => string | undefined;
  /** Versioned path prefix used when the path override is unset. */
  defaultPath: string;
  /** Returns the ops-controlled path override from the typed env module. */
  path: () => string | undefined;
  /** Human-readable label used for logging + error attribution. */
  serviceName: string;
}

const BED_SERVICES: Record<BedServiceName, BedServiceDefinition> = {
  visitors: {
    serviceName: "Visitors",
    defaultPath: "/visitors",
    path: () => env.VISITORS_API_PATH,
    apiKey: () => env.VISITORS_API_KEY,
  },
  search: {
    serviceName: "Search",
    defaultPath: "/search/v1",
    path: () => env.SEARCH_API_PATH,
    apiKey: () => env.SEARCH_API_KEY,
  },
  "vehicle-detail": {
    serviceName: "VehicleDetail",
    defaultPath: "/vehicles/v1",
    path: () => env.VDP_API_PATH,
    apiKey: () => env.VDP_API_KEY,
  },
  geo: {
    serviceName: "Geo",
    defaultPath: "/geo/v1",
    path: () => env.GEO_API_PATH,
    apiKey: () => env.GEO_API_KEY,
  },
  // ── Origination (FND-01) ────────────────────────────────────────────────
  // Third-party providers (identity, trade-in) are separate services so their
  // credentials, versioning, and outages stay isolated from the core flow.
  origination: {
    serviceName: "Origination",
    defaultPath: "/origination/v1",
    path: () => env.ORIGINATION_API_PATH,
    apiKey: () => env.ORIGINATION_API_KEY,
  },
  "origination-identity": {
    serviceName: "OriginationIdentity",
    defaultPath: "/origination-identity/v1",
    path: () => env.ORIGINATION_IDENTITY_API_PATH,
    apiKey: () => env.ORIGINATION_IDENTITY_API_KEY,
  },
  "origination-tradein": {
    serviceName: "OriginationTradeIn",
    defaultPath: "/origination-tradein/v1",
    path: () => env.ORIGINATION_TRADEIN_API_PATH,
    apiKey: () => env.ORIGINATION_TRADEIN_API_KEY,
  },
};

export interface ResolvedBedService {
  /** This service's API key, sent as `X-API-Key`. */
  apiKey: string;
  /** Fully-composed base URL: shared domain + the service's versioned path. */
  baseUrl: string;
  serviceName: string;
  /** Optional multi-tenant id, sent as `X-Tenant-Id`. */
  tenantId?: string;
}

function joinDomainAndPath(domain: string, path: string): string {
  const cleanDomain = domain.replace(TRAILING_SLASHES, "");
  const cleanPath = path.replace(LEADING_SLASHES, "").replace(TRAILING_SLASHES, "");
  return cleanPath ? `${cleanDomain}/${cleanPath}` : cleanDomain;
}

/**
 * Resolve a BED service's runtime config from the environment. Returns `null`
 * when the shared domain or API key is missing (treated as "not configured").
 */
export function resolveBedService(name: BedServiceName): ResolvedBedService | null {
  const definition = BED_SERVICES[name];
  const domain = env.API_UPSTREAM_URL;
  const apiKey = definition.apiKey()?.trim();

  if (!(domain && apiKey)) {
    return null;
  }

  const path = definition.path()?.trim() || definition.defaultPath;

  return {
    serviceName: definition.serviceName,
    baseUrl: joinDomainAndPath(domain, path),
    apiKey,
    tenantId: env.BED_TENANT_ID || undefined,
  };
}

// ─── Per-endpoint versioning ─────────────────────────────────────────────
//
// The service base is version-agnostic (`/visitors`); each endpoint carries its
// OWN version, so one service can mix versions (resolve on v1 while suggestions
// moves to v2). Version precedence, highest first:
//   1. the endpoint's own env var    (e.g. VISITORS_SUGGESTIONS_VERSION)
//   2. the service-wide default env  (VISITORS_API_VERSION)
//   3. the hard-coded fallback       (DEFAULT_ENDPOINT_VERSION)
//
// - Bump one endpoint:      VISITORS_SUGGESTIONS_VERSION=v2
// - Bump the whole service: VISITORS_API_VERSION=v2
// - Add an endpoint:        add a line to VISITORS_ENDPOINTS

const DEFAULT_ENDPOINT_VERSION = "v1";

// Endpoint version vars (VISITORS_RESOLVE_VERSION, VISITORS_API_VERSION, etc.) are
// ops-only overrides intentionally excluded from the typed schema — they are
// operational knobs that default safely and have no impact on app correctness.
// See docs/adr/0011-typed-env-vars.md §3 (Dynamic lookup exceptions).
function endpointPath(name: string, endpointVersionEnv: string, serviceVersionEnv: string): string {
  const version =
    process.env[endpointVersionEnv]?.trim() ||
    process.env[serviceVersionEnv]?.trim() ||
    DEFAULT_ENDPOINT_VERSION;
  return `/${version}/${name}`;
}

/**
 * Versioned endpoint paths for the visitors service, relative to its mount.
 * Pass these to `client.post(...)` — e.g.
 * `client.post(VISITORS_ENDPOINTS.resolve)` → `…/visitors/<version>/resolve`.
 */
export const VISITORS_ENDPOINTS = {
  resolve: endpointPath("resolve", "VISITORS_RESOLVE_VERSION", "VISITORS_API_VERSION"),
  suggestions: endpointPath("suggestions", "VISITORS_SUGGESTIONS_VERSION", "VISITORS_API_VERSION"),
} as const;

const watchlistBase = endpointPath(
  "watchlist",
  "VISITORS_WATCHLIST_VERSION",
  "VISITORS_API_VERSION"
);

/**
 * Versioned watchlist endpoint paths (visitors service). `base` serves both
 * `GET` (list) and `POST` (add) — `…/visitors/<version>/watchlist`; `byVin(vin)`
 * serves `DELETE` — `…/visitors/<version>/watchlist/<vin>`.
 */
export const WATCHLIST_ENDPOINTS = {
  base: watchlistBase,
  byVin: (vin: string) => `${watchlistBase}/${encodeURIComponent(vin)}`,
} as const;

/**
 * Versioned activities endpoint path (visitors service).
 * POST only — `…/visitors/<version>/activities`.
 */
export const ACTIVITIES_ENDPOINTS = {
  base: endpointPath("activities", "VISITORS_ACTIVITIES_VERSION", "VISITORS_API_VERSION"),
} as const;

const searchesBase = endpointPath("searches", "VISITORS_SEARCHES_VERSION", "VISITORS_API_VERSION");

/**
 * Versioned searches endpoint paths (visitors service). `base` serves
 * `GET` (list) — `…/visitors/<version>/searches`; `byId(searchId)` serves
 * `PATCH` (pin/unpin/rename) — `…/visitors/<version>/searches/<searchId>`.
 */
export const SEARCHES_ENDPOINTS = {
  base: searchesBase,
  byId: (searchId: string) => `${searchesBase}/${encodeURIComponent(searchId)}`,
} as const;

const preferencesBase = endpointPath(
  "preferences",
  "VISITORS_PREFERENCES_VERSION",
  "VISITORS_API_VERSION"
);

/**
 * Versioned preferences endpoint paths (visitors service).
 * `lifetime` → GET/PATCH lifetime prefs; `bySearchId` → GET/PATCH search-scoped.
 */
export const PREFERENCES_ENDPOINTS = {
  lifetime: preferencesBase,
  bySearchId: (searchId: string) => `${preferencesBase}/search/${encodeURIComponent(searchId)}`,
} as const;

/**
 * Versioned endpoint paths for the search service, relative to its mount.
 *
 * NOTE: The search service mount path already includes "/search/v1" in its
 * defaultPath, unlike the visitors service which is unversioned ("/visitors").
 * To maintain consistency with the per-endpoint versioning pattern used by
 * other services, these endpoints are relative paths that get appended to
 * the resolved search baseUrl.
 *
 * Path resolution examples:
 * - baseUrl: "https://api.example.com/search/v1"
 * - client.post(SEARCH_ENDPOINTS.results) → "…/search/v1/search" (filtered search)
 * - client.post(SEARCH_ENDPOINTS.agent)   → "…/search/v1/search/agent" (conversational)
 * - client.post(SEARCH_ENDPOINTS.filters) → "…/search/v1/filters" (smart-filter listing)
 *
 * The doubled "/search" in the resolved URL is intentional and matches the
 * upstream API structure where filtered search is POST /search and
 * conversational search is POST /search/agent.
 */
export const SEARCH_ENDPOINTS = {
  /** POST /search — filtered inventory search */
  results: "/search",
  /** POST /search/agent — conversational search agent */
  agent: "/search/agent",
  /** POST /filters — smart-filter listing */
  filters: "/filters",
} as const;
