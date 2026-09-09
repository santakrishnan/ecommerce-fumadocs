import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import type { AgentVersion as SdkAgentVersion } from "@ucmp/sdk-search-api";
import { agentVersionEnum } from "@ucmp/sdk-search-api";
import { z } from "zod";

/**
 * Search agent backend selection — cookie contract + option metadata.
 *
 * Client-safe (no `server-only`/`next/headers`): imported by both the server
 * resolver and the `/demo-settings` picker. Server-only behaviour lives in
 * `@features/search/bff` (`resolveAgentBackend`, `agent-version-registry`).
 */

/**
 * App-local agent versions not yet present in the SDK's `agentVersionEnum`.
 *
 * The generated SDK is the source of truth for released versions, but it lags
 * the backend. List in-flight versions here so we can drive them against the
 * live API before the SDK catches up. Delete an entry once it lands in the SDK
 * enum — it then flows in automatically via `agentVersionEnum`.
 */
export const AGENT_VERSION_OVERRIDES = ["v3"] as const;

/** A version that exists in the app but not (yet) in the SDK enum. */
export type AgentVersionOverride = (typeof AGENT_VERSION_OVERRIDES)[number];

/** Upstream agent version — SDK-released versions plus in-flight local overrides. */
export type AgentVersion = SdkAgentVersion | AgentVersionOverride;

/** One year, in seconds. */
const AGENT_BACKEND_COOKIE_TTL = 60 * 60 * 24 * 365;

/**
 * Overrides `SEARCH_AGENT_BACKEND` at runtime, per browser (set via `/demo-settings`).
 * `buildCookieConfig` (client-safe) applies the prod `__Host-` prefix.
 */
export const agentBackendCookie = buildCookieConfig(
  "demo-agent-backend",
  AGENT_BACKEND_COOKIE_TTL,
  {
    httpOnly: true,
    sameSite: "lax",
  }
);

export const AGENT_BACKEND_COOKIE = agentBackendCookie.name;

/** Runtime list of every agent version: SDK enum values plus local overrides. */
export const AGENT_VERSIONS = [
  ...Object.values(agentVersionEnum),
  ...AGENT_VERSION_OVERRIDES,
] as readonly AgentVersion[];

/** Zod enum over {@link AGENT_VERSIONS} — SDK versions plus local overrides. */
export const agentVersionSchema = z.enum(AGENT_VERSIONS as [AgentVersion, ...AgentVersion[]]);

/** App-local transports with no SDK version of their own. */
export const AGENT_TRANSPORTS = ["static_mock"] as const;

/** Every SDK version plus the local-only transports. */
export const agentBackendSchema = z.union([agentVersionSchema, z.enum(AGENT_TRANSPORTS)]);

export type AgentBackend = z.infer<typeof agentBackendSchema>;

/** Fallback when neither the cookie nor `SEARCH_AGENT_BACKEND` is set. */
export const DEFAULT_AGENT_BACKEND: AgentBackend = "v2";

interface AgentBackendOption {
  description: string;
  title: string;
  value: AgentBackend;
}

/** Options for the `/demo-settings` picker. */
export const AGENT_BACKEND_OPTIONS: readonly AgentBackendOption[] = [
  {
    value: "v1",
    title: "Agent v1",
    description: "Arrow agent via the BED search service (v1 payload).",
  },
  {
    value: "v2",
    title: "Agent v2",
    description: "Arrow agent via the BED search service (v2 payload). Default.",
  },
  {
    value: "v3",
    title: "Agent v3",
    description:
      "Arrow agent via the BED search service (v3 payload). Experimental — ahead of the SDK.",
  },
  {
    value: "static_mock",
    title: "Static mock",
    description: "Offline fixture stream from local demo data — no backend call.",
  },
] as const;

/**
 * Coerce an arbitrary string to a valid backend for display; unknown → default.
 * Used to seed the settings picker, not on the request path.
 */
export function coerceAgentBackend(value: string | null | undefined): AgentBackend {
  const parsed = agentBackendSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_AGENT_BACKEND;
}

/** True when `backend` is a known agent version (SDK version or local override). */
export function isAgentVersion(backend: string): backend is AgentVersion {
  return agentVersionSchema.safeParse(backend).success;
}

/**
 * Map a resolved backend string to an upstream version. `static_mock` and any
 * unknown value fall back to {@link DEFAULT_AGENT_VERSION}. Takes a raw `string`
 * because `resolveAgentBackend()` returns the env/cookie value verbatim.
 */
export function resolveAgentVersion(backend: string): AgentVersion {
  return isAgentVersion(backend) ? backend : DEFAULT_AGENT_VERSION;
}

/** The version implied by {@link DEFAULT_AGENT_BACKEND}. */
export const DEFAULT_AGENT_VERSION: AgentVersion = isAgentVersion(DEFAULT_AGENT_BACKEND)
  ? DEFAULT_AGENT_BACKEND
  : (Object.values(agentVersionEnum)[0] as AgentVersion);
