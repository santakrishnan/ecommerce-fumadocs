import "server-only";

import { env } from "@config/env";
import { BED_API_KEY_HEADER, BED_TENANT_HEADER } from "@shared/lib/http/bed-client";
import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";
import type { ServerClient } from "@shared/lib/http/types";

const GEO_DEALER_HEADER = "X-Dealer-Id";

/**
 * Create a configured HTTP client for the geo upstream service.
 *
 * Uses `createServerClient` directly (rather than `createBedClient`) because
 * the Arrow Geo API requires an additional `X-Dealer-Id` header not part of
 * the standard BED identity contract.
 *
 * Reads auth configuration from environment at call time so that the cached
 * wrapper only needs to pass `baseUrl` (a non-secret) — keeping secrets out
 * of cache key material.
 *
 * Headers sent on every request:
 * - `X-API-Key` — per-service key (from GEO_API_KEY env)
 * - `X-Tenant-Id` — multi-tenant selector (from BED_TENANT_ID env)
 * - `X-Dealer-Id` — dealer identifier (from GEO_DEALER_ID env)
 * - `X-Origin-Verify` — WAF pass-through
 * - `X-Trace-Id` — auto-generated UUID (handled by createServerClient)
 * - `Accept: application/json`
 */
export function createGeoClient(baseUrl: string): ServerClient {
  const defaultHeaders: Record<string, string> = {
    ...originVerifyHeader(),
    Accept: "application/json",
  };

  const tenantId = env.BED_TENANT_ID?.trim();
  if (tenantId) {
    defaultHeaders[BED_TENANT_HEADER] = tenantId;
  }

  const dealerId = env.GEO_DEALER_ID?.trim();
  if (dealerId) {
    defaultHeaders[GEO_DEALER_HEADER] = dealerId;
  }

  const apiKey = env.GEO_API_KEY?.trim() ?? "";

  return createServerClient({
    baseUrl,
    serviceName: "Geo",
    apiKey: { headerName: BED_API_KEY_HEADER, value: apiKey },
    defaultHeaders,
  });
}
