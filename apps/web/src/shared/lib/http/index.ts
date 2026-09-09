/**
 * HTTP Client Module
 *
 * Dual-environment HTTP client system with encryption, header injection,
 * retry-with-jitter, schema validation, and sealed cookie utilities.
 *
 * Server-side (RSC, route handlers, services):
 *   import { createServerClient, ServerHttpError } from "@shared/lib/http";
 *
 * Client-side (React components, hooks):
 *   import { createHttpClient, ClientHttpError } from "@shared/lib/http";
 *
 * Shared:
 *   import { encryptPayload, decryptPayload } from "@shared/lib/http";
 *   import { encodeCookieValue, decodeCookieValue } from "@shared/lib/http";
 */

// BED service client (server-only — per-service key + identity headers)
export {
  BED_API_KEY_HEADER,
  BED_SESSION_HEADER,
  BED_TENANT_HEADER,
  BED_VISITOR_HEADER,
  type BedVisitorIdentity,
  buildBedHeaders,
  buildBedHeadersWithApiKey,
  createBedClient,
} from "./bed-client";
// BED service identity (server-only — reads visitor cookies for X-header forwarding)
export { readVisitorIdentity } from "./bed-identity";
// Browser client
export {
  buildTrackingHeaders,
  ClientHttpError,
  createHttpClient,
} from "./client-api";
// Encryption
export {
  decryptPayload,
  ENCRYPTED_HEADER,
  encryptPayload,
  resolveEncryptionKey,
} from "./encryption";

// Hashing
export { sha256Hex } from "./hash";
// Sealed cookies (universal — Node + browser)
export {
  buildCookieConfig,
  type CookieConfig,
  decodeCookieValue,
  encodeCookieValue,
} from "./sealed-cookie";
// Server client (server-only — importing from a Client Component will error)
export {
  createServerClient,
  decryptRequestPayload,
  extractForwardHeaders,
  extractTrackingIds,
  ServerHttpError,
} from "./server-api";

// Types
export type {
  ClientConfig,
  ClientRequestOptions,
  HttpClient,
  HttpErrorJSON,
  Interceptors,
  NextFetchRequestConfig,
  QueryParams,
  RequestContext,
  ResponseSchema,
  ServerClient,
  ServerClientConfig,
  ServerRequestOptions,
  TokenProvider,
  TrackingIds,
} from "./types";
