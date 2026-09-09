/**
 * Internal helpers shared by server-api and client-api.
 *
 * All exports here are pure and environment-agnostic (no Node `Buffer`, no
 * `next/server` imports) so they work in both Server Components and the
 * browser bundle.
 */

import type { QueryParams, QueryParamValue, TokenProvider } from "./types";

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);
const ABSOLUTE_URL = /^https?:\/\//i;

export function isIdempotentMethod(method: string): boolean {
  return IDEMPOTENT_METHODS.has(method.toUpperCase());
}

/**
 * Default retryable statuses: 408 Request Timeout, 425 Too Early,
 * 429 Too Many Requests, and all 5xx.
 */
export function isRetryableStatus(status: number, allowed?: ReadonlySet<number>): boolean {
  if (allowed) {
    return allowed.has(status);
  }
  if (status === 0) {
    return true;
  }
  if (status === 408 || status === 425 || status === 429) {
    return true;
  }
  return status >= 500 && status <= 599;
}

/**
 * Merge any number of `HeadersInit` sources into a single `Headers` instance.
 * Later sources override earlier ones (case-insensitive, per the Fetch spec).
 */
export function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) {
      continue;
    }
    const next = new Headers(source);
    next.forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

/**
 * Build a URL by joining `baseUrl` + `path` and appending query params.
 *
 * - Absolute paths (http://, https://) bypass `baseUrl`.
 * - Trailing `/` on baseUrl and leading `/` on path are normalised.
 * - `null` / `undefined` param values are skipped; arrays repeat the key.
 */
function joinBaseAndPath(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path;
  }
  if (ABSOLUTE_URL.test(path)) {
    return path;
  }
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function appendParam(usp: URLSearchParams, key: string, value: QueryParamValue): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (!Array.isArray(value)) {
    usp.append(key, String(value));
    return true;
  }
  let appended = false;
  for (const item of value) {
    if (item === undefined || item === null) {
      continue;
    }
    usp.append(key, String(item));
    appended = true;
  }
  return appended;
}

export function buildUrl(baseUrl: string, path: string, params?: QueryParams): string {
  const url = joinBaseAndPath(baseUrl, path);
  if (!params) {
    return url;
  }
  const usp = new URLSearchParams();
  let appended = false;
  for (const [key, value] of Object.entries(params)) {
    if (appendParam(usp, key, value)) {
      appended = true;
    }
  }
  if (!appended) {
    return url;
  }
  const qs = usp.toString();
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}

/**
 * Detect Fetch-native body types so we pass them through untouched
 * (FormData boundary, Blob mime, ReadableStream, etc.).
 */
function isPassThroughBody(value: unknown): value is BodyInit {
  if (typeof value === "string") {
    return true;
  }
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    return true;
  }
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return true;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return true;
  }
  if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    return true;
  }
  if (value instanceof ArrayBuffer) {
    return true;
  }
  if (ArrayBuffer.isView(value)) {
    return true;
  }
  return false;
}

export interface SerialisedBody {
  body: BodyInit | undefined;
  /**
   * Suggested Content-Type. `null` means "let the runtime decide"
   * (e.g. FormData → multipart with boundary). The caller should only set
   * Content-Type when this is a non-null string AND the user hasn't already
   * supplied one.
   */
  contentType: string | null;
}

/**
 * Convert an arbitrary body value into something `fetch()` can send.
 *
 * - `undefined` / `null` → no body.
 * - Fetch-native types (string, FormData, Blob, ArrayBuffer, ReadableStream,
 *   URLSearchParams) → pass through, no Content-Type set.
 * - Anything else → `JSON.stringify`, Content-Type `application/json`.
 */
export function serialiseBody(body: unknown): SerialisedBody {
  if (body === undefined || body === null) {
    return { body: undefined, contentType: null };
  }
  if (isPassThroughBody(body)) {
    return { body, contentType: null };
  }
  return { body: JSON.stringify(body), contentType: "application/json" };
}

/**
 * Parse a `Retry-After` header value.
 * Accepts seconds (e.g. `"120"`) or HTTP-date (e.g. `"Wed, 21 Oct 2026 ..."`).
 * Returns milliseconds, or `null` if unparseable.
 */
export function parseRetryAfter(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }
  const date = Date.parse(trimmed);
  if (Number.isFinite(date)) {
    const delta = date - Date.now();
    return delta > 0 ? delta : 0;
  }
  return null;
}

/**
 * Compute backoff delay with full jitter.
 * If the server suggested a wait via `Retry-After`, that wins.
 */
export function backoffMs(
  baseDelay: number,
  attempt: number,
  retryAfter: number | null,
  rng: () => number = Math.random
): number {
  if (retryAfter !== null) {
    return retryAfter;
  }
  const exp = baseDelay * 2 ** attempt;
  const jitter = 0.5 + rng() * 0.5;
  return Math.round(exp * jitter);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Read an error response body exactly once: read as text, then try `JSON.parse`.
 *
 * This avoids the classic bug of calling `.json()` and falling back to
 * `.text()` — `Response` bodies can only be consumed once.
 */
export async function readErrorBody(response: Response): Promise<{ body: unknown; code: string }> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    text = "";
  }

  const fallbackCode = `HTTP_${response.status}`;

  if (!text) {
    return { body: null, code: fallbackCode };
  }

  try {
    const parsed = JSON.parse(text);
    let code = fallbackCode;
    if (
      parsed &&
      typeof parsed === "object" &&
      "code" in parsed &&
      typeof (parsed as { code: unknown }).code === "string"
    ) {
      code = (parsed as { code: string }).code;
    }
    return { body: parsed, code };
  } catch {
    return { body: text, code: fallbackCode };
  }
}

/**
 * Resolve a static-or-callback token. Returns `null` when no token is
 * configured or the callback returns nullish.
 */
export async function resolveToken(provider: TokenProvider | undefined): Promise<string | null> {
  if (provider === undefined || provider === null) {
    return null;
  }
  if (typeof provider === "string") {
    return provider;
  }
  const result = await provider();
  return result ?? null;
}

/**
 * Compose two `AbortSignal`s. Returns a signal that aborts when either input
 * aborts. Uses `AbortSignal.any` when available (Node 20.3+ / modern browsers),
 * otherwise falls back to manual wiring.
 */
export function anySignal(signals: Array<AbortSignal | undefined>): AbortSignal {
  const valid = signals.filter((s): s is AbortSignal => s !== undefined);
  if (valid.length === 0) {
    return new AbortController().signal;
  }
  if (valid.length === 1) {
    const only = valid[0];
    if (only) {
      return only;
    }
  }
  const maybeAny = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (typeof maybeAny === "function") {
    return maybeAny(valid);
  }
  const controller = new AbortController();
  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
