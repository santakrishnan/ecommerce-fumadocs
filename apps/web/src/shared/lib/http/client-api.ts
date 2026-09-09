import { ENCRYPTED_HEADER, encryptPayload, resolveEncryptionKey } from "./encryption";
import {
  anySignal,
  backoffMs,
  buildUrl,
  isIdempotentMethod,
  isRetryableStatus,
  mergeHeaders,
  parseRetryAfter,
  readErrorBody,
  serialiseBody,
  sleep,
} from "./internal";
import type {
  ClientConfig,
  ClientRequestOptions,
  HttpClient,
  HttpErrorJSON,
  RequestContext,
  ResponseSchema,
  TrackingIds,
} from "./types";

// ─── Error Class ─────────────────────────────────────────────────────────

/**
 * Structured error for browser-side HTTP requests.
 */
export class ClientHttpError extends Error {
  readonly body?: unknown;
  readonly code: string;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    code: string,
    body?: unknown,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "ClientHttpError";
    this.status = status;
    this.code = code;
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
      status: this.status,
    };
  }
}

// ─── Client Factory ─────────────────────────────────────────────────────

/**
 * Create an HTTP client for browser-side use.
 *
 * Features
 * - Tracking-ID header injection (`headerMap` ↔ `ids`).
 * - Optional JWE body encryption (`encrypt: true`, JSON-shaped bodies only).
 * - Timeout via `AbortController`, composed with caller-provided signals.
 * - Idempotent-only retry with exponential backoff + jitter + `Retry-After`.
 * - Query-param serialisation; `FormData` / `Blob` / `ReadableStream` pass-through.
 * - Optional response schema validation (Zod / Valibot / ArkType).
 * - Request / response / error interceptors.
 *
 * ```ts
 * const client = createHttpClient(
 *   { sessionId: "abc", fingerprintId: "xyz" },
 *   { sessionId: "X-Session-Id", fingerprintId: "X-Fp-Id" },
 *   { baseUrl: "/api", retries: 1 }
 * );
 *
 * const data = await client.post<Result>("/events/track", payload, {
 *   encrypt: true,
 *   schema: ResultSchema,
 * });
 * ```
 */
export function createHttpClient(
  ids: TrackingIds,
  headerMap: Record<string, string>,
  config: ClientConfig = {}
): HttpClient {
  const {
    baseUrl = "",
    credentials: defaultCredentials = "include",
    defaultHeaders,
    interceptors,
    retries: defaultRetries = 1,
    retryDelay = 300,
    retryStatuses,
    timeout: defaultTimeout = 30_000,
  } = config;

  const retryStatusSet = retryStatuses ? new Set(retryStatuses) : undefined;

  function buildHeaders(
    method: string,
    extra: HeadersInit | undefined,
    contentType: string | null,
    encryptedHeader: string | null
  ): Headers {
    const headers = mergeHeaders(defaultHeaders);

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (contentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", contentType);
    }

    // Tracking IDs win over defaultHeaders but lose to per-request overrides.
    for (const [trackingKey, headerName] of Object.entries(headerMap)) {
      const value = ids[trackingKey];
      if (value && headerName) {
        headers.set(headerName, value);
      }
    }

    if (encryptedHeader) {
      headers.set(ENCRYPTED_HEADER, encryptedHeader);
    }

    if (extra) {
      const extras = new Headers(extra);
      extras.forEach((value, name) => {
        headers.set(name, value);
      });
    }

    if ((method === "GET" || method === "HEAD") && headers.has("Content-Type")) {
      headers.delete("Content-Type");
    }

    return headers;
  }

  async function prepareBody(
    body: unknown,
    encrypt: boolean | undefined
  ): Promise<{ body: BodyInit | undefined; contentType: string | null; encrypted: boolean }> {
    if (body === undefined || body === null) {
      return { body: undefined, contentType: null, encrypted: false };
    }

    if (encrypt) {
      // Encryption only makes sense for JSON-shaped payloads. Pass-through
      // body types (FormData, Blob, etc.) would be ambiguous to encrypt.
      if (
        (typeof FormData !== "undefined" && body instanceof FormData) ||
        (typeof Blob !== "undefined" && body instanceof Blob) ||
        (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) ||
        (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body)
      ) {
        throw new ClientHttpError(
          "encrypt: true is only supported for JSON-shaped bodies",
          0,
          "ENCRYPTION_INVALID_BODY"
        );
      }
      const key = resolveEncryptionKey();
      if (!key) {
        throw new ClientHttpError(
          "Encryption requested but NEXT_PUBLIC_ENCRYPTION_KEY is not set",
          0,
          "ENCRYPTION_KEY_MISSING"
        );
      }
      const jwe = await encryptPayload(body, key);
      return { body: jwe, contentType: "text/plain", encrypted: true };
    }

    return { ...serialiseBody(body), encrypted: false };
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
      throw new ClientHttpError(
        "Response failed schema validation",
        response.status,
        "SCHEMA_VALIDATION",
        data,
        { cause: err }
      );
    }
  }

  async function buildErrorFromResponse(
    response: Response,
    method: string,
    url: string
  ): Promise<ClientHttpError> {
    const { body, code } = await readErrorBody(response);
    return new ClientHttpError(
      `API ${method} ${url} → ${response.status} ${response.statusText}`,
      response.status,
      code,
      body
    );
  }

  function wrapTransportError(error: unknown, path: string, reqTimeout: number): ClientHttpError {
    const err = error as Error;
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return new ClientHttpError(
        `Request to ${path} timed out after ${reqTimeout}ms`,
        0,
        "TIMEOUT",
        undefined,
        { cause: error }
      );
    }
    return new ClientHttpError(
      `Network error: ${err?.message ?? String(error)}`,
      0,
      "NETWORK_ERROR",
      undefined,
      { cause: error }
    );
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
    } catch {
      // swallow — interceptors must not break the request
    }
  }

  function isRetryable(
    error: ClientHttpError,
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
    prepared: { body: BodyInit | undefined; contentType: string | null; encrypted: boolean },
    opts: ClientRequestOptions<T> | undefined,
    attempt: number,
    reqTimeout: number
  ): Promise<{ data: T } | { error: ClientHttpError; response?: Response }> {
    const headers = buildHeaders(
      method,
      opts?.headers,
      prepared.contentType,
      prepared.encrypted ? "true" : null
    );

    const ctx: RequestContext = {
      attempt,
      body: prepared.body,
      headers,
      method,
      url,
    };
    await callInterceptor(interceptors?.onRequest, ctx);

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), reqTimeout);
    const signal = anySignal([opts?.signal, timeoutController.signal]);

    try {
      const response = await fetch(url, {
        body: prepared.body,
        credentials: opts?.credentials ?? defaultCredentials,
        headers,
        method,
        signal,
      });

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
        error instanceof ClientHttpError ? error : wrapTransportError(error, url, reqTimeout);
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
    opts?: ClientRequestOptions<T>
  ): Promise<T> {
    const url = buildUrl(baseUrl, path, opts?.params);
    const reqTimeout = opts?.timeout ?? defaultTimeout;
    const maxRetries = opts?.retries ?? defaultRetries;
    const allowNonIdempotent = opts?.idempotent ?? false;
    const prepared = await prepareBody(body, opts?.encrypt);

    let attempt = 0;
    let lastError: ClientHttpError | null = null;

    while (attempt <= maxRetries) {
      const result = await executeAttempt(url, method, prepared, opts, attempt, reqTimeout);

      if ("data" in result) {
        return result.data;
      }

      lastError = result.error;

      const canRetry = attempt < maxRetries && isRetryable(lastError, method, allowNonIdempotent);
      if (!canRetry) {
        throw lastError;
      }

      const retryAfter = parseRetryAfter(result.response?.headers.get("Retry-After"));
      await sleep(backoffMs(retryDelay, attempt, retryAfter));
      attempt++;
    }

    throw lastError ?? new ClientHttpError("Unexpected request failure", 0, "UNKNOWN");
  }

  return {
    delete: <T = unknown>(path: string, opts?: ClientRequestOptions<T>) =>
      request<T>("DELETE", path, undefined, opts),
    get: <T = unknown>(path: string, opts?: ClientRequestOptions<T>) =>
      request<T>("GET", path, undefined, opts),
    patch: <T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>) =>
      request<T>("PATCH", path, body, opts),
    post: <T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>) =>
      request<T>("POST", path, body, opts),
    put: <T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>) =>
      request<T>("PUT", path, body, opts),
  };
}

/**
 * Build tracking headers from IDs without creating a full client.
 *
 * Useful for one-off `fetch()` calls that need tracking headers but don't
 * benefit from the full client wrapper.
 */
export function buildTrackingHeaders(
  ids: TrackingIds,
  headerMap: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, headerName] of Object.entries(headerMap)) {
    const value = ids[key];
    if (value && headerName) {
      headers[headerName] = value;
    }
  }
  return headers;
}
