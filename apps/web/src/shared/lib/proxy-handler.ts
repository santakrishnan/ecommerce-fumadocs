import "server-only";

import { env } from "@config/env";
import { matchProxyRoute } from "@config/proxy-routes";
import { NextResponse } from "next/server";

const LEADING_SLASH_PATTERN = /^\//;

/** Timeout for upstream requests in milliseconds */
const DEFAULT_UPSTREAM_TIMEOUT_MS = 30_000;
const UPSTREAM_TIMEOUT_MS = env.UPSTREAM_TIMEOUT_MS ?? DEFAULT_UPSTREAM_TIMEOUT_MS;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

type ProxyErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "ROUTE_NOT_ALLOWED"
  | "UPSTREAM_NOT_CONFIGURED"
  | "UPSTREAM_FETCH_FAILED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR";

function createStructuredError(status: number, code: ProxyErrorCode, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        status,
      },
    },
    { status }
  );
}

function sanitizeUpstreamMessage(status: number): string {
  if (status >= 500) {
    return "Upstream service unavailable";
  }
  if (status === 404) {
    return "Upstream resource not found";
  }
  if (status === 401 || status === 403) {
    return "Upstream request was not authorized";
  }
  if (status >= 400) {
    return "Upstream request failed";
  }
  return "Unexpected upstream response";
}

function toForwardHeaders(headers: Headers): Headers {
  const forwarded = new Headers();

  for (const [key, value] of headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    forwarded.set(key, value);
  }

  return forwarded;
}

function toResponseHeaders(headers: Headers): Headers {
  const responseHeaders = new Headers();

  for (const [key, value] of headers.entries()) {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      continue;
    }
    responseHeaders.set(key, value);
  }

  return responseHeaders;
}

function buildUpstreamUrl(requestUrl: URL, pathname: string): URL {
  const upstreamBase = env.API_UPSTREAM_URL;
  if (!upstreamBase) {
    throw new Error("API_UPSTREAM_URL is not configured");
  }

  const normalizedBase = upstreamBase.endsWith("/") ? upstreamBase : `${upstreamBase}/`;
  const upstreamUrl = new URL(pathname.replace(LEADING_SLASH_PATTERN, ""), normalizedBase);
  upstreamUrl.search = requestUrl.search;
  return upstreamUrl;
}

async function forwardToUpstream(request: Request, pathname: string): Promise<Response> {
  const requestUrl = new URL(request.url);
  const upstreamUrl = buildUpstreamUrl(requestUrl, pathname);
  const method = request.method.toUpperCase();
  const body = method === "GET" ? undefined : await request.text();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: toForwardHeaders(request.headers),
      body,
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!upstreamResponse.ok) {
      return createStructuredError(
        upstreamResponse.status,
        "UPSTREAM_ERROR",
        sanitizeUpstreamMessage(upstreamResponse.status)
      );
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: toResponseHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return createStructuredError(504, "UPSTREAM_TIMEOUT", "Upstream request timed out");
    }
    return createStructuredError(502, "UPSTREAM_FETCH_FAILED", "Unable to reach upstream service");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function proxyRequest(request: Request, pathname: string): Promise<Response> {
  const method = request.method.toUpperCase();

  if (method !== "GET" && method !== "POST" && method !== "DELETE") {
    return createStructuredError(
      405,
      "METHOD_NOT_ALLOWED",
      "Only GET, POST, and DELETE are supported"
    );
  }

  const matchedRoute = matchProxyRoute(pathname, method);
  if (!matchedRoute) {
    return createStructuredError(
      404,
      "ROUTE_NOT_ALLOWED",
      `Route ${method} ${pathname} is not registered for proxying`
    );
  }

  const upstreamBase = env.API_UPSTREAM_URL?.trim();
  if (upstreamBase) {
    return forwardToUpstream(request, pathname);
  }

  return createStructuredError(
    503,
    "UPSTREAM_NOT_CONFIGURED",
    "API_UPSTREAM_URL is not configured"
  );
}
