/**
 * Shared media constants + host resolution — the single source of truth for the
 * media CDN host and the same-origin proxy mount. Used by BOTH the client-side
 * URL rewriter (`normalizeImageUrl`) and the server-side proxy
 * (`resolveMediaUpstream`), so the host default and route prefix are defined
 * once, never duplicated across a client/server boundary.
 *
 * Pure and client-safe: reads only the non-secret `NEXT_PUBLIC_MEDIA_CDN_URL`.
 * The secret `X-Origin-Verify` key lives solely in the server proxy.
 */

/** Media CDN host used when `NEXT_PUBLIC_MEDIA_CDN_URL` is unset. */
export const DEFAULT_MEDIA_HOST = "https://media.sandbox.arrow.toyotafinancial.com";
/** Same-origin mount served by the media proxy route handler. */
export const PROXY_PATH_PREFIX = "/api/v1/media";

const TRAILING_SLASHES_RE = /\/+$/;

/**
 * The media CDN host, stripped of a trailing slash. Not a secret — shared
 * identically by the client rewriter and the server fetch so both point at the
 * same origin.
 *
 * Reads `process.env` directly — see ADR-0011 §7 (Documented exceptions).
 */
export function resolveMediaHost(): string {
  const configured = process.env.NEXT_PUBLIC_MEDIA_CDN_URL;
  return configured?.trim().replace(TRAILING_SLASHES_RE, "") || DEFAULT_MEDIA_HOST;
}
