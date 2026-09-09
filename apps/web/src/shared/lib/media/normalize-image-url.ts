import { PROXY_PATH_PREFIX, resolveMediaHost } from "./media-constants";

/**
 * Normalize an image URL from the API into a value `next/image` can render.
 *
 * One entry point for every image `src`, applied at the data/flatten boundary:
 *
 * 1. Empty / missing             → `fallback`.
 * 2. Localhost fixture origin     → stripped to a same-origin path, so the
 *    `next/image` optimizer's private-IP restriction doesn't reject it.
 * 3. Relative media path          → the same-origin media proxy path. The API
 *    returns `public/<hash>/<file>`; the leading `public/` is dropped (the CDN
 *    serves the file directly) and it is routed through `/api/v1/media/…` so the
 *    server can attach the CDN's `X-Origin-Verify` header (never shipped to the
 *    browser). See `app/api/v1/media/[...mediaPath]/route.ts`.
 * 4. Absolute URL on the media host → the same media proxy path (header-gated).
 * 5. Any other absolute URL       → returned unchanged (public CDNs, etc.).
 *
 * Pure and client-safe: the media host comes from the non-secret
 * `NEXT_PUBLIC_MEDIA_CDN_URL` (via `resolveMediaHost`), so this is safe to call
 * from either a server mapper or a client component.
 *
 * @param url - Image URL from the API (may be undefined).
 * @param fallback - Image path used when `url` is empty (default: an inventory placeholder).
 * @returns A render-ready `src`: a proxy path, a same-origin path, a pass-through URL, or the fallback.
 */

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i;
const MEDIA_PUBLIC_PREFIX_RE = /^\/?public\//;
const DEFAULT_FALLBACK = "/inventory-card/default.png";

export function normalizeImageUrl(
  url: string | undefined,
  fallback: string = DEFAULT_FALLBACK
): string {
  const rawUrl = url?.trim();
  if (!rawUrl) {
    return fallback;
  }

  // Fixture origin → same-origin path (skips the optimizer's private-IP block).
  if (LOCALHOST_ORIGIN_RE.test(rawUrl)) {
    return rawUrl.replace(LOCALHOST_ORIGIN_RE, "") || fallback;
  }

  // Relative media path ("public/<hash>/<file>") → header-gated proxy path.
  if (MEDIA_PUBLIC_PREFIX_RE.test(rawUrl)) {
    const path = rawUrl.replace(MEDIA_PUBLIC_PREFIX_RE, "");
    return path ? `${PROXY_PATH_PREFIX}/${path}` : fallback;
  }

  // Absolute URL: route only the gated media host through the proxy; others pass through.
  try {
    const target = new URL(rawUrl);
    if (target.host === new URL(resolveMediaHost()).host) {
      return `${PROXY_PATH_PREFIX}${target.pathname}${target.search}`;
    }
  } catch {
    // Not an absolute URL (already a relative/app path) — leave it as-is.
  }

  return rawUrl;
}
