import "server-only";

import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_NOT_MODIFIED,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@shared/lib/http/status-codes";
import { createLogger } from "@shared/lib/logger";
import { resolveMediaUpstream } from "./media-upstream";

/**
 * Streaming reverse-proxy for a header-gated media CDN.
 *
 * The upstream rejects any request without an `X-Origin-Verify` header, so the
 * key is attached here (server-side) and never leaves the server. The route
 * handler stays a one-liner; all resilience — timeout, error shaping, traversal
 * guard, conditional/range passthrough — lives here so it is unit-testable and
 * reusable. The image bytes are streamed, never buffered, so memory stays flat
 * regardless of asset size.
 */

const log = createLogger("media-proxy");

/** A path segment that could escape the media mount via URL resolution. */
const TRAVERSAL_SEGMENT = "..";

/** Neutral fallback when the upstream omits a Content-Type. */
const DEFAULT_CONTENT_TYPE = "application/octet-stream";

/**
 * Client → upstream request headers we forward so conditional revalidation
 * (304) and byte-range streaming (206) keep working through the proxy.
 */
const FORWARDED_REQUEST_HEADERS = ["range", "if-none-match", "if-modified-since"] as const;

/**
 * Upstream → client response headers we pass back. Strict allowlist: upstream
 * `set-cookie` / auth headers must never be relayed to the browser.
 */
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
] as const;

/**
 * Build the upstream URL from decoded path segments.
 *
 * Each segment is re-encoded individually, so a segment can neither inject a
 * path separator (`/` → `%2F`) nor a scheme (`:` → `%3A`) — that plus the
 * `..` rejection in {@link proxyMediaRequest} keeps this closed to traversal
 * and SSRF while still forwarding any incoming query string (signed URLs).
 */
function buildUpstreamUrl(baseUrl: string, segments: string[], requestUrl: string): URL {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const encodedPath = segments.map(encodeURIComponent).join("/");
  const url = new URL(encodedPath, normalizedBase);
  url.search = new URL(requestUrl).search;
  return url;
}

function buildUpstreamHeaders(request: Request, originVerifyKey: string): Headers {
  const headers = new Headers({ "X-Origin-Verify": originVerifyKey });
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function buildResponseHeaders(upstream: Response, cacheMaxAge: number): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", DEFAULT_CONTENT_TYPE);
  }
  // Respect the origin's caching intent; fall back to a long, safe default.
  headers.set(
    "cache-control",
    upstream.headers.get("cache-control") ?? `public, max-age=${cacheMaxAge}`
  );
  return headers;
}

/**
 * Proxy a single media asset by its decoded path segments, injecting the
 * `X-Origin-Verify` key. Returns:
 * - 503 when the media upstream is not configured
 * - 400 for empty or traversal (`..`) paths
 * - the upstream status verbatim on 4xx/5xx (bytes withheld)
 * - 504 on timeout, 502 on connection failure
 * - 200/206/304 with the streamed body on success
 */
export async function proxyMediaRequest(request: Request, segments: string[]): Promise<Response> {
  const config = resolveMediaUpstream();
  if (!config) {
    return new Response(null, { status: HTTP_STATUS_SERVICE_UNAVAILABLE });
  }

  if (segments.length === 0 || segments.some((segment) => segment === TRAVERSAL_SEGMENT)) {
    return new Response(null, { status: HTTP_STATUS_BAD_REQUEST });
  }

  const isHead = request.method.toUpperCase() === "HEAD";
  const upstreamUrl = buildUpstreamUrl(config.baseUrl, segments, request.url);
  const path = segments.join("/");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: isHead ? "HEAD" : "GET",
      headers: buildUpstreamHeaders(request, config.originVerifyKey),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!(upstream.ok || upstream.status === HTTP_STATUS_NOT_MODIFIED)) {
      log.warn("upstream media error", { path, status: upstream.status });
      return new Response(null, { status: upstream.status });
    }

    return new Response(isHead ? null : upstream.body, {
      status: upstream.status,
      headers: buildResponseHeaders(upstream, config.cacheMaxAge),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      log.warn("upstream media timeout", { path, timeoutMs: config.timeoutMs });
      return new Response(null, { status: HTTP_STATUS_GATEWAY_TIMEOUT });
    }
    log.error("upstream media fetch failed", {
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(null, { status: HTTP_STATUS_BAD_GATEWAY });
  } finally {
    clearTimeout(timeout);
  }
}
