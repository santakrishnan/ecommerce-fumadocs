import { z } from "zod";

// Shared env schema — imported by both next.config.ts (build-time validation)
// and src/config/env.ts / src/config/client-env.ts (runtime typed modules).
//
// Do NOT add "server-only" here — this file is consumed by next.config.ts
// which runs outside the Next.js module boundary.
//
// See docs/adr/0011-typed-env-vars.md for the full implementation plan.

const isProduction = process.env.NODE_ENV === "production";

const optStr = z.string().min(1).optional();
// Trims surrounding whitespace before validation — use for header/token values
// where accidental whitespace would produce a malformed outgoing request.
const trimOptStr = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().min(1).optional()
);
const boolStr = z.enum(["true", "false"]).optional();
// URL vars that tests may stub to "" to mean "not configured": preprocess
// empty string → undefined so URL validation doesn't reject the empty value.
const optUrl = z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

// ─── Server-side vars ────────────────────────────────────────────────────────
// Never bundled into client code. Import via src/config/env.ts.
export const serverEnvSchema = z.object({
  // ── BED shared domain ──────────────────────────────────────────────────
  API_UPSTREAM_URL: optUrl,
  BED_TENANT_ID: trimOptStr,
  UPSTREAM_TIMEOUT_MS: z.coerce.number().positive().optional(),

  // ── BED per-service keys & path overrides ──────────────────────────────
  // Listed individually so each key is validated even though bed-services.ts
  // resolves them dynamically via process.env[definition.apiKeyEnv].
  VISITORS_API_KEY: optStr,
  VISITORS_API_PATH: optStr,
  SEARCH_API_KEY: optStr,
  SEARCH_API_PATH: optStr,
  VDP_API_KEY: optStr,
  VDP_API_PATH: optStr,
  GEO_API_KEY: optStr,
  GEO_API_PATH: optStr,
  GEO_DEALER_ID: optStr,

  // Origination BFF. Each third-party provider is kept as its OWN BED
  // service so credentials, versioning, and outages stay isolated.
  ORIGINATION_API_KEY: optStr,
  ORIGINATION_API_PATH: optStr,
  ORIGINATION_IDENTITY_API_KEY: optStr, // Experian identity · BFF-03
  ORIGINATION_IDENTITY_API_PATH: optStr,
  ORIGINATION_TRADEIN_API_KEY: optStr, // trade-in valuation · BFF-04
  ORIGINATION_TRADEIN_API_PATH: optStr,

  // ── Revalidation secret — required in production ────────────────────────
  REVALIDATION_SECRET: isProduction ? z.string().min(1) : optStr,

  // ── Third-party services ────────────────────────────────────────────────
  FINGERPRINT_API_KEY: optStr,
  FINGERPRINT_REGION: optStr,
  CAR_CUTTER_GALLERY_HASH: optStr,

  // ── Shared infrastructure ───────────────────────────────────────────
  // Header injected on every outbound Arrow API call to pass WAF origin check.
  HEADER_X_ORIGIN_VERIFY: trimOptStr,
  // AES-256 encryption key (Base64url-encoded). Server-side counterpart to
  // NEXT_PUBLIC_ENCRYPTION_KEY — the client var is the fallback in isomorphic
  // contexts (see shared/lib/http/encryption.ts).
  ENCRYPTION_KEY: optStr,
  // Media proxy
  MEDIA_UPSTREAM_TIMEOUT_MS: z.coerce.number().positive().optional(),
  MEDIA_CACHE_MAX_AGE: z.coerce.number().positive().optional(),

  // ── Search agent ────────────────────────────────────────────────────────
  SEARCH_AGENT_BACKEND: optStr,
  SEARCH_AGENT_V3_PATH: optStr,
  SEARCH_AGENT_V3_COOKIE: optStr,
  SEARCH_AGENT_MOCK_DELAY_MS: z.coerce.number().nonnegative().optional(),
  SEARCH_AGENT_DEBUG: boolStr,

  // ── Feature config ──────────────────────────────────────────────────────
  PROFILE_ACTIVITY_MODE: z.enum(["immediate", "queued"]).optional(),
  USE_STOCK_IMAGES: optStr,
  NEW_TODAY_DAYS_IN_STOCK: z.coerce.number().positive().optional(),
  NEW_TODAY_LIMIT: z.coerce.number().positive().optional(),
  RARE_FINDS_LIMIT: z.coerce.number().positive().optional(),
  DEV_SEED_LOCATION: optStr,
  MOCK_LATENCY: boolStr,
  FORCE_VDP_SOLD: boolStr,

  // ── Mock toggles (each overrides real upstream for that feature) ────────
  USE_PROFILE_MOCKS: boolStr,
  USE_PROFILE_APPOINTMENT_MOCKS: boolStr,
  USE_PROFILE_SUGGESTIONS_MOCKS: boolStr,
  USE_PROFILE_SEARCH_MOCKS: boolStr,
  USE_SEARCH_MOCKS: boolStr,
  USE_SEARCH_RESULTS_MOCKS: boolStr,
  USE_SEARCH_AGENT_MOCKS: boolStr,
  USE_AUTOCOMPLETE_MOCKS: boolStr,
  USE_FILTERS_MOCKS: boolStr,
  USE_VDP_MOCKS: boolStr,
  USE_RECOMMENDATIONS_MOCKS: boolStr,
  USE_GEO_MOCKS: boolStr,
  USE_TRADE_IN_MOCKS: boolStr,
  USE_TRADE_IN_LOOKUP_MOCKS: boolStr,

  // ── Origination mock toggle (FND-01) ──────────────────────────────────────
  // One flag covers the whole origination domain (all BFF-01…BFF-09 endpoints
  // + the state-transition PATCH). When the OpenAPI spec lands only the
  // *-upstream.ts services + response safeParse change.
  USE_ORIGINATION_MOCKS: boolStr,

  // Note: FEATURE_FLAG_* vars are intentionally excluded.
  // They are assembled dynamically from flag names at runtime and cannot be
  // statically enumerated. See src/config/flags/server.ts.
});

// ─── Client-safe (NEXT_PUBLIC_*) vars ───────────────────────────────────────
// Inlined into the client bundle by the Next.js bundler. Safe to import from
// Server and Client Components alike via src/config/client-env.ts.
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optUrl,
  NEXT_PUBLIC_API_URL: optUrl,
  NEXT_PUBLIC_MEDIA_CDN_URL: optUrl,
  NEXT_PUBLIC_IMAGE_BASE_URL: optUrl,
  NEXT_PUBLIC_FINGERPRINT_API_KEY: optStr,
  NEXT_PUBLIC_FINGERPRINT_REGION: optStr,
  NEXT_PUBLIC_MOCKS: boolStr,
  /** Passkey API base; defaults to the same-origin `/api/auth/passkey` (dev-only mock until the BED lands). */
  NEXT_PUBLIC_PASSKEY_API_BASE: optStr,
  NEXT_PUBLIC_SEARCH_RECS_LIMIT: z.coerce.number().positive().optional(),
  // Client-side fallback encryption key for isomorphic use (see shared/lib/http/encryption.ts).
  NEXT_PUBLIC_ENCRYPTION_KEY: optStr,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
