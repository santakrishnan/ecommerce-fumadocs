import "server-only";

import type { NextRequest } from "next/server";
import { decryptPayload, ENCRYPTED_HEADER, resolveEncryptionKey } from "./encryption";
import {
  anySignal,
  backoffMs,
  buildUrl,
  isIdempotentMethod,
  isRetryableStatus,
  mergeHeaders,
  parseRetryAfter,
  readErrorBody,
  resolveToken,
  serialiseBody,
  sleep,
} from "./internal";
import type {
  HttpErrorJSON,
  NextFetchRequestConfig,
  RequestContext,
  ResponseSchema,
  ServerClient,
  ServerClientConfig,
  ServerRequestOptions,
  TrackingIds,
} from "./types";

// ─── Error Class ─────────────────────────────────────────────────────────

/**
 * Structured error for server-side HTTP requests.
 *
 * Carries `status`, machine-readable `code`, the originating service name,
 * and the raw response body for downstream logging / error pages.
 */
export class ServerHttpError extends Error {
  readonly body?: unknown;
  readonly code: string;
  readonly service: string;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    code: string,
    service: string,
    body?: unknown,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ServerHttpError";
    this.status = status;
    this.code = code;
    this.service = service;
    this.body = body;
  }

  get isRetryable(): boolean {
    return isRetryableStatus(this.status);
  }

  toJSON(): HttpErrorJSON {
    return {
      body: this.body,
      code: this.code,
      message: this.message,
      name: this.name,
      service: this.service,
      status: this.status,
    };
  }
}

// ─── Request Helpers (API Routes) ────────────────────────────────────────

/**
 * Decrypt an incoming request body when the encrypted header is set,
 * otherwise fall back to standard JSON parsing.
 */
export async function decryptRequestPayload<T = unknown>(request: NextRequest): Promise<T> {
  const isEncrypted = request.headers.get(ENCRYPTED_HEADER) === "true";

  if (!isEncrypted) {
    return (await request.json()) as T;
  }

  const key = resolveEncryptionKey();
  if (!key) {
    throw new ServerHttpError(
      "Encrypted request received but ENCRYPTION_KEY is not configured",
      400,
      "ENCRYPTION_KEY_MISSING",
      "HTTP"
    );
  }

  const jwe = await request.text();
  try {
    return await decryptPayload<T>(jwe, key);
  } catch (error) {
    throw new ServerHttpError(
      `Failed to decrypt payload: ${(error as Error).message}`,
      400,
      "DECRYPTION_FAILED",
      "HTTP",
      undefined,
      { cause: error }
    );
  }
}

/**
 * Extract tracking IDs from request headers, falling back to cookies.
 */
export function extractTrackingIds(
  request: NextRequest,
  headerMap: Record<string, string>,
  cookieMap: Record<string, string>,
  decodeCookie?: (raw: string) => string | null
): TrackingIds {
  const ids: TrackingIds = {};

  for (const key of Object.keys(headerMap)) {
    const headerName = headerMap[key];
    const cookieName = cookieMap[key];

    const headerValue = headerName ? request.headers.get(headerName) : null;
    if (headerValue && headerValue !== "anonymous") {
      ids[key] = headerValue;
      continue;
    }

    if (cookieName) {
      const raw = request.cookies.get(cookieName)?.value;
      if (raw) {
        ids[key] = decodeCookie ? (decodeCookie(raw) ?? raw) : raw;
      } else {
        ids[key] = null;
      }
    } else {
      ids[key] = null;
    }
  }

  return ids;
}

/**
 * Extract a whitelist of headers from the incoming request for forwarding.
 */
export function extractForwardHeaders(
  request: NextRequest,
  allowedHeaders: ReadonlySet<string>
): Record<string, string> {
  const forwarded: Record<string, string> = {};

  for (const [name, value] of request.headers.entries()) {
    if (allowedHeaders.has(name.toLowerCase()) && value) {
      forwarded[name] = value;
    }
  }

  return forwarded;
}

// ─── Server Client Factory ──────────────────────────────────────────────

const isDev = process.env.NODE_ENV === "development";

/**
 * Create a type-safe HTTP client for server-side use (RSC, route handlers,
 * Server Actions, service-layer calls).
 *
 * For a **Toyota BED service**, prefer `createBedClient(resolveBedService(...))`
 * (see `bed-client.ts`) rather than calling this directly — it pre-wires the
 * per-service `X-API-Key`, `X-Tenant-Id`, and visitor identity headers on top
 * of this client. Use this factory directly for non-BED upstreams or bespoke
 * configs.
 *
 * Features
 * - Dynamic auth tokens (string or async function — supports rotation).
 * - Tracking-ID injection driven by `headerMap`.
 * - Idempotent-only retry with exponential backoff + full jitter and
 *   `Retry-After` (seconds or HTTP-date) honored.
 * - Timeout via `AbortController`, composed with caller-provided signals.
 * - Query-param serialisation (`params`), including array repeats.
 * - Body pass-through for `FormData`, `Blob`, `URLSearchParams`,
 *   `ReadableStream`, `ArrayBuffer`.
 * - Next.js fetch extensions (`revalidate`, `tags`) pass-through; explicit
 *   `cache` (defaults to `"no-store"` for Next 16 cache-components clarity).
 * - Optional response schema validation (Zod / Valibot / ArkType).
 * - Request / response / error interceptors.
 *
 * ```ts
 * const client = createServerClient({
 *   baseUrl: process.env.API_URL!,
 *   authToken: () => getAccessToken(),
 *   serviceName: "VDP",
 *   retries: 2,
 * });
 *
 * const vehicle = await client.get<Vehicle>(`/vehicles/${vin}`, {
 *   next: { revalidate: 300, tags: [`vehicle-${vin}`] },
 *   cache: "force-cache",
 *   schema: VehicleSchema,
 * });
 * ```
 */
export function createServerClient(config: ServerClientConfig): ServerClient {
  const {
    apiKey,
    authToken,
    baseUrl,
    defaultCache = "no-store",
    defaultHeaders,
    headerMap = {},
    interceptors,
    retries: defaultRetries = 2,
    retryDelay = 300,
    retryStatuses,
    serviceName = "API",
    timeout: defaultTimeout = 15_000,
  } = config;

  const retryStatusSet = retryStatuses ? new Set(retryStatuses) : undefined;
  const logPrefix = `[HTTP→${serviceName}]`;

  async function applyAuth(headers: Headers): Promise<void> {
    const [token, key] = await Promise.all([
      resolveToken(authToken),
      apiKey ? resolveToken(apiKey.value) : Promise.resolve(null),
    ]);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (apiKey && key) {
      headers.set(apiKey.headerName, key);
    }
  }

  function applyTrackingIds(headers: Headers, ids: TrackingIds | undefined): void {
    if (!ids) {
      return;
    }
    for (const [trackingKey, headerName] of Object.entries(headerMap)) {
      const value = ids[trackingKey];
      if (value && headerName) {
        headers.set(headerName, value);
      }
    }
  }

  function applyExtras(headers: Headers, extra: HeadersInit | undefined): void {
    if (!extra) {
      return;
    }
    new Headers(extra).forEach((value, name) => {
      headers.set(name, value);
    });
  }

  async function buildHeaders(
    method: string,
    ids: TrackingIds | undefined,
    extra: HeadersInit | undefined,
    contentType: string | null
  ): Promise<Headers> {
    const headers = mergeHeaders(defaultHeaders);

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (contentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", contentType);
    }

    await applyAuth(headers);
    applyTrackingIds(headers, ids);
    applyExtras(headers, extra);

    // `Content-Type` is meaningless on bodyless methods and confuses some servers.
    if ((method === "GET" || method === "HEAD") && headers.has("Content-Type")) {
      headers.delete("Content-Type");
    }

    return headers;
  }

  async function callInterceptor<A extends unknown[]>(
    fn: ((...args: A) => void | Promise<void>) | undefined,
    ...args: A
  ): Promise<void> {
    if (!fn) {
      return;
    }
    try {
      await fn(...args);
    } catch (err) {
      if (isDev) {
        console.warn(`${logPrefix} interceptor threw`, err);
      }
    }
  }

  function parseSuccess<T>(
    response: Response,
    data: unknown,
    schema: ResponseSchema<T> | undefined
  ): T {
    if (!schema) {
      return data as T;
    }
    try {
      return schema.parse(data);
    } catch (err) {
      throw new ServerHttpError(
        `${serviceName} response failed schema validation`,
        response.status,
        "SCHEMA_VALIDATION",
        serviceName,
        data,
        { cause: err }
      );
    }
  }

  async function buildErrorFromResponse(
    response: Response,
    method: string,
    path: string
  ): Promise<ServerHttpError> {
    const { body, code } = await readErrorBody(response);
    return new ServerHttpError(
      `${serviceName} ${method} ${path} → ${response.status} ${response.statusText}`,
      response.status,
      code,
      serviceName,
      body
    );
  }

  function wrapTransportError(error: unknown, path: string, reqTimeout: number): ServerHttpError {
    const err = error as Error;
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return new ServerHttpError(
        `${serviceName} request to ${path} timed out after ${reqTimeout}ms`,
        0,
        "TIMEOUT",
        serviceName,
        undefined,
        { cause: error }
      );
    }
    return new ServerHttpError(
      `${serviceName} network error: ${err?.message ?? String(error)}`,
      0,
      "NETWORK_ERROR",
      serviceName,
      undefined,
      { cause: error }
    );
  }

  function isRetryable(
    error: ServerHttpError,
    method: string,
    allowNonIdempotent: boolean
  ): boolean {
    if (!isRetryableStatus(error.status, retryStatusSet)) {
      return false;
    }
    return allowNonIdempotent || isIdempotentMethod(method);
  }

  async function executeAttempt<T>(
    url: string,
    method: string,
    serialised: { body: BodyInit | undefined; contentType: string | null },
    opts: ServerRequestOptions<T> | undefined,
    attempt: number,
    reqTimeout: number
  ): Promise<{ data: T } | { error: ServerHttpError; response?: Response }> {
    const headers = await buildHeaders(method, opts?.ids, opts?.headers, serialised.contentType);

    const ctx: RequestContext = {
      attempt,
      body: serialised.body,
      headers,
      method,
      url,
    };
    await callInterceptor(interceptors?.onRequest, ctx);

    // Every outbound request carries a trace ID for distributed tracing.
    // Preserve caller/interceptor value when provided, otherwise generate one.
    const traceId = headers.get("X-Trace-Id")?.trim();
    if (!traceId) {
      headers.set("X-Trace-Id", crypto.randomUUID());
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), reqTimeout);
    const signal = anySignal([opts?.signal, timeoutController.signal]);

    try {
      if (isDev) {
        console.log(`${logPrefix} ${method} ${url}`);
      }

      const init: RequestInit & { next?: NextFetchRequestConfig } = {
        body: serialised.body,
        cache: opts?.cache ?? defaultCache,
        headers,
        method,
        signal,
      };
      if (opts?.next) {
        init.next = opts.next;
      }

      const response = await fetch(url, init);

      await callInterceptor(interceptors?.onResponse, response, ctx);

      if (!response.ok) {
        const error = await buildErrorFromResponse(response, method, url);
        await callInterceptor(interceptors?.onError, error, ctx);
        return { error, response };
      }

      if (response.status === 204) {
        return { data: parseSuccess(response, undefined, opts?.schema) };
      }

      const data = await response.json().catch(() => undefined);
      return { data: parseSuccess(response, data, opts?.schema) };
    } catch (error) {
      const wrapped =
        error instanceof ServerHttpError ? error : wrapTransportError(error, url, reqTimeout);
      await callInterceptor(interceptors?.onError, wrapped, ctx);
      return { error: wrapped };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function request<T>(
    method: string,
    path: string,
    body: unknown,
    opts?: ServerRequestOptions<T>
  ): Promise<T> {
    const url = buildUrl(baseUrl, path, opts?.params);
    const reqTimeout = opts?.timeout ?? defaultTimeout;
    const maxRetries = opts?.retries ?? defaultRetries;
    const allowNonIdempotent = opts?.idempotent ?? false;
    const serialised = serialiseBody(body);

    let attempt = 0;
    let lastError: ServerHttpError | null = null;

    // attempt 0 is the initial request; up to `maxRetries` additional tries
    while (attempt <= maxRetries) {
      const result = await executeAttempt(url, method, serialised, opts, attempt, reqTimeout);

      if ("data" in result) {
        return result.data;
      }

      lastError = result.error;

      const canRetry = attempt < maxRetries && isRetryable(lastError, method, allowNonIdempotent);
      if (!canRetry) {
        throw lastError;
      }

      const retryAfter = parseRetryAfter(result.response?.headers.get("Retry-After"));
      const delay = backoffMs(retryDelay, attempt, retryAfter);
      if (isDev) {
        console.warn(
          `${logPrefix} retrying ${method} ${url} in ${delay}ms (attempt ${attempt + 1})`
        );
      }
      await sleep(delay);
      attempt++;
    }

    throw lastError ?? new ServerHttpError("Unexpected request failure", 0, "UNKNOWN", serviceName);
  }

  return {
    delete: <T = unknown>(path: string, opts?: ServerRequestOptions<T>) =>
      request<T>("DELETE", path, undefined, opts),
    get: <T = unknown>(path: string, opts?: ServerRequestOptions<T>) =>
      request<T>("GET", path, undefined, opts),
    patch: <T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>) =>
      request<T>("PATCH", path, body, opts),
    post: <T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>) =>
      request<T>("POST", path, body, opts),
    put: <T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>) =>
      request<T>("PUT", path, body, opts),
  };
}
