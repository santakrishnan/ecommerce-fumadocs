import "server-only";

import { env } from "@config/env";
import { resolveMediaHost } from "./media-constants";

/**
 * Media upstream (header-gated CDN) configuration.
 *
 * The media host gates every request behind an `X-Origin-Verify` header. The
 * `/api/v1/media/[...mediaPath]` route injects that key server-side so it never
 * reaches the browser bundle.
 *
 * The host itself is resolved from the shared `resolveMediaHost()` (the same one
 * the client rewriter uses), so client and server always agree on the origin.
 * The **key** is the config switch: without `HEADER_X_ORIGIN_VERIFY` this
 * returns `null` (callers treat that as "not configured" → 503) since we can't
 * authenticate.
 *
 *   NEXT_PUBLIC_MEDIA_CDN_URL = https://media.…   (optional; defaults to sandbox, via resolveMediaHost)
 *   HEADER_X_ORIGIN_VERIFY   = <secret>          (required)
 *   MEDIA_UPSTREAM_TIMEOUT_MS = 10000             (optional, integer ms)
 *   MEDIA_CACHE_MAX_AGE       = 86400             (optional, integer seconds)
 */

/** Abort an upstream media fetch after this long when the env var is unset. */
const DEFAULT_TIMEOUT_MS = 10_000;
/** Fallback `Cache-Control: max-age` (seconds) when upstream sends none. */
const DEFAULT_CACHE_MAX_AGE = 86_400;

export interface ResolvedMediaUpstream {
  /** Origin the proxied path is resolved against, e.g. `https://media.…`. */
  baseUrl: string;
  /** Fallback browser/CDN cache lifetime (seconds) when upstream omits one. */
  cacheMaxAge: number;
  /** Secret sent as `X-Origin-Verify` on every upstream request. */
  originVerifyKey: string;
  /** Upstream fetch timeout in milliseconds. */
  timeoutMs: number;
}

/**
 * Resolve the media upstream config from the environment, or `null` when the
 * verify key is unset (the host has a sensible default; the key is the switch).
 */
export function resolveMediaUpstream(): ResolvedMediaUpstream | null {
  const originVerifyKey = env.HEADER_X_ORIGIN_VERIFY;
  if (!originVerifyKey) {
    return null;
  }

  return {
    baseUrl: resolveMediaHost(),
    originVerifyKey,
    timeoutMs: env.MEDIA_UPSTREAM_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
    cacheMaxAge: env.MEDIA_CACHE_MAX_AGE ?? DEFAULT_CACHE_MAX_AGE,
  };
}
