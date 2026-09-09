/**
 * Normalize image URLs for next/image compatibility.
 *
 * - Strips localhost/127.0.0.1/[::1] origins so fixture assets are treated as
 *   local paths and bypass the next/image optimizer's private IP restrictions.
 * - Resolves relative `public/…` paths (returned by the media API) to absolute
 *   URLs by prepending `MEDIA_BASE_URL` (env-configurable via
 *   `NEXT_PUBLIC_MEDIA_CDN_URL`, falls back to the sandbox CDN).
 *
 * @param url - Image URL (may be undefined)
 * @param fallback - Fallback image path if URL is empty (default: "/inventory-card/inventory-card1.png")
 * @returns Normalized path or absolute URL
 */

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i;
const MEDIA_PUBLIC_PREFIX_RE = /^public\//;
const DEFAULT_FALLBACK = "/inventory-card/inventory-card1.png";

export const MEDIA_BASE_URL =
  (typeof process === "undefined" ? undefined : process.env?.NEXT_PUBLIC_MEDIA_CDN_URL)?.replace(
    /\/+$/,
    ""
  ) || "https://media.sandbox.arrow.toyotafinancial.com";

export function normalizeLocalhostImageUrl(
  url: string | undefined,
  fallback: string = DEFAULT_FALLBACK
): string {
  const rawUrl = url?.trim();
  if (!rawUrl) {
    return fallback;
  }

  // Relative path from media API (e.g. "public/<hash>/001.jpg") → absolute CDN URL.
  // Strip the leading "public/" segment — the CDN serves files directly at /<hash>/file.jpg.
  if (MEDIA_PUBLIC_PREFIX_RE.test(rawUrl)) {
    const path = rawUrl.replace(MEDIA_PUBLIC_PREFIX_RE, "");
    return `${MEDIA_BASE_URL}/${path}`;
  }

  const normalized = rawUrl.replace(LOCALHOST_ORIGIN_RE, "");
  return normalized || fallback;
}
