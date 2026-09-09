/**
 * Shared types for the HTTP client system.
 *
 * Used by both server-api and client-api so there's a single contract for
 * request options, error shapes, interceptors, and tracking IDs.
 */

// ─── Tracking IDs ────────────────────────────────────────────────────────

export interface TrackingIds {
  [key: string]: string | null | undefined;
}

// ─── Tokens, schemas, query params ──────────────────────────────────────

/**
 * Static string or a (possibly async) function. The function form lets you
 * refresh tokens on each attempt — useful when an access token is rotating.
 * Returning `null` / `undefined` means "no token this time".
 */
export type TokenProvider =
  | string
  | (() => string | null | undefined | Promise<string | null | undefined>);

/**
 * Minimal structural shape compatible with Zod, Valibot, ArkType — anything
 * that exposes a synchronous `parse(value)` that throws on invalid input.
 */
export interface ResponseSchema<T> {
  parse(value: unknown): T;
}

export type QueryParamPrimitive = string | number | boolean | null | undefined;
export type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
export type QueryParams = Record<string, QueryParamValue>;

// ─── Interceptors ────────────────────────────────────────────────────────

/**
 * Mutable context handed to interceptors. Mutate `headers` to add/remove
 * headers before the request goes out (e.g. attach a fresh access token).
 */
export interface RequestContext {
  attempt: number;
  body: BodyInit | undefined;
  headers: Headers;
  method: string;
  url: string;
}

export interface Interceptors {
  onError?: (error: unknown, ctx: RequestContext) => void | Promise<void>;
  onRequest?: (ctx: RequestContext) => void | Promise<void>;
  onResponse?: (response: Response, ctx: RequestContext) => void | Promise<void>;
}

// ─── Next.js fetch extensions ───────────────────────────────────────────

export interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

// ─── Server Client ───────────────────────────────────────────────────────

export interface ServerClientConfig {
  /** API key sent via a custom header. Value may be a function for rotation. */
  apiKey?: { headerName: string; value: TokenProvider };
  /** Bearer token for `Authorization`. May be a function for rotation. */
  authToken?: TokenProvider;
  /** Base URL prepended to every request path. */
  baseUrl: string;
  /**
   * Default `cache` mode applied when a request doesn't set one.
   *
   * Defaults to `"no-store"` because Next.js 16 deprecated implicit fetch
   * caching — being explicit avoids surprises under PPR / cache components.
   */
  defaultCache?: RequestCache;
  /** Headers merged into every request. */
  defaultHeaders?: HeadersInit;
  /** Header name → tracking-ID key mapping. */
  headerMap?: Record<string, string>;
  /** Request / response / error lifecycle hooks. */
  interceptors?: Interceptors;
  /** Max retry attempts on retryable errors (default: 2). */
  retries?: number;
  /** Initial backoff in ms — doubles each attempt with jitter (default: 300). */
  retryDelay?: number;
  /** Override the default retryable status set (`{408, 425, 429, 5xx}`). */
  retryStatuses?: number[];
  /** Label for log messages and error attribution. */
  serviceName?: string;
  /** Default per-request timeout in ms (default: 15_000). */
  timeout?: number;
}

export interface ServerRequestOptions<T = unknown> {
  /** Override `cache` for this request only. */
  cache?: RequestCache;
  /** Extra headers for this request. Later wins over `defaultHeaders`. */
  headers?: HeadersInit;
  /**
   * Force retry of a non-idempotent method (POST/PATCH).
   * Use only when the endpoint is safe to invoke more than once
   * (idempotency key, naturally idempotent semantics, etc.).
   */
  idempotent?: boolean;
  /** Tracking IDs to inject as headers (via `headerMap`). */
  ids?: TrackingIds;
  /** Next.js fetch extensions (`revalidate`, `tags`). */
  next?: NextFetchRequestConfig;
  /** Query-string parameters appended to the URL. */
  params?: QueryParams;
  /** Override the client-level `retries` for this request. */
  retries?: number;
  /** Validate the parsed JSON response (e.g. a Zod schema). */
  schema?: ResponseSchema<T>;
  /** Caller-controlled abort signal — composed with the timeout signal. */
  signal?: AbortSignal;
  /** Per-request timeout override. */
  timeout?: number;
}

export interface ServerClient {
  delete<T = unknown>(path: string, opts?: ServerRequestOptions<T>): Promise<T>;
  get<T = unknown>(path: string, opts?: ServerRequestOptions<T>): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, opts?: ServerRequestOptions<T>): Promise<T>;
}

// ─── Client (browser) Client ────────────────────────────────────────────

export interface ClientConfig {
  baseUrl?: string;
  /** Sent on every request unless `credentials` is overridden. Default `"include"`. */
  credentials?: RequestCredentials;
  defaultHeaders?: HeadersInit;
  interceptors?: Interceptors;
  retries?: number;
  retryDelay?: number;
  retryStatuses?: number[];
  timeout?: number;
}

export interface ClientRequestOptions<T = unknown> {
  credentials?: RequestCredentials;
  /** Encrypt the request body as a compact JWE. JSON bodies only. */
  encrypt?: boolean;
  headers?: HeadersInit;
  idempotent?: boolean;
  params?: QueryParams;
  retries?: number;
  schema?: ResponseSchema<T>;
  signal?: AbortSignal;
  timeout?: number;
}

export interface HttpClient {
  delete<T = unknown>(path: string, opts?: ClientRequestOptions<T>): Promise<T>;
  get<T = unknown>(path: string, opts?: ClientRequestOptions<T>): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, opts?: ClientRequestOptions<T>): Promise<T>;
}

// ─── Errors ──────────────────────────────────────────────────────────────

export interface HttpErrorJSON {
  body?: unknown;
  code: string;
  message: string;
  name: string;
  service?: string;
  status: number;
}
