import "server-only";

import { extractClientIpHeaders } from "@shared/lib/http/client-ip";
import { type NextRequest, NextResponse } from "next/server";

// Request/response helpers shared by the passkey route handlers.

const JSON_MEDIA_TYPE = /^application\/json\s*(;|$)/i;

/** Passkey responses carry one-time challenges and identity; never cache them. */
export const PASSKEY_NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

/** What the use cases need from the request, beyond the body. */
export interface PasskeyRequestContext {
  /** Client-IP chain, forwarded upstream for rate limiting. */
  forwardedHeaders: Record<string, string>;
  /** From `getRequestTraceId()`; logged and forwarded upstream as `X-Trace-Id`. */
  traceId: string;
  /** Only for advisory device labels such as "Chrome on Mac". */
  userAgent: string | null;
}

/** Success envelope: `{ data, meta }`. */
export interface PasskeyEnvelope<T> {
  data: T;
  meta: { timestamp: string; traceId: string };
}

/**
 * The JSON body, or `undefined` when it is missing, malformed, or not sent as
 * `application/json`. Requiring the JSON media type means a cross-site page
 * can't post here without a CORS preflight these routes never grant — the
 * CSRF guard for these cookie-authenticated calls.
 */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  if (!JSON_MEDIA_TYPE.test(request.headers.get("content-type") ?? "")) {
    return;
  }
  try {
    return await request.json();
  } catch {
    return;
  }
}

export function toPasskeyContext(request: NextRequest, traceId: string): PasskeyRequestContext {
  return {
    forwardedHeaders: extractClientIpHeaders(request),
    traceId,
    userAgent: request.headers.get("user-agent"),
  };
}

export function passkeyDataResponse<T>(data: T, traceId: string): NextResponse<PasskeyEnvelope<T>> {
  return NextResponse.json<PasskeyEnvelope<T>>(
    { data, meta: { timestamp: new Date().toISOString(), traceId } },
    { headers: PASSKEY_NO_STORE_HEADERS }
  );
}
