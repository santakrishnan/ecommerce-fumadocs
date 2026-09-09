import "server-only";

import {
  NEW_TODAY_EMPTY_RESPONSE,
  NEW_TODAY_SUCCESS_RESPONSE,
  NEW_TODAY_VALIDATION_ERROR_RESPONSE,
} from "@features/landing/__fixtures__/new-today.fixtures";
import { type NewTodayResponse, newTodayResponseSchema } from "@features/landing/data/schemas";

// Planned backend swap — see `shared/services/api/client.ts` for where service
// auth attaches (the shared, app-wide backend client):
// import { apiClient } from "@shared/services/api";
// import type { TrackingIds } from "@shared/lib/http";

type NewTodayFixture = "empty" | "success";

export interface GetNewTodayInput {
  /** Dev/demo fixture selector (`empty` | `success`). The route strips it in production. */
  fixture?: string | null;
  /**
   * Visitor ZIP from the location cookie. `cookies()` is disallowed inside
   * `"use cache"` scopes, so callers (Server Component or route handler) read
   * the cookie outside the cached scope and pass the value here — as an
   * argument it becomes part of the compiler-generated cache key.
   * The mock dataset ignores it; once the real upstream lands it is forwarded
   * as a query param / header to scope recommendations to the visitor's area.
   */
  zipCode?: string | null;
  /**
   * Planned backend swap: per-request tracking IDs, read at the front doors —
   * the Server Component via `cookies()`, the route handler via
   * `extractTrackingIds(request, headerMap, cookieMap)` from `@shared/lib/http`.
   * Passed to `apiClient` as `ids`, they become outgoing headers through the
   * client's `headerMap` (e.g. sessionId → `x-session-id`).
   */
  // trackingIds?: TrackingIds;
}

function toFixture(value: string | null | undefined): NewTodayFixture {
  return value === "empty" ? "empty" : "success";
}

/**
 * Shared New Today use case.
 *
 * New Today flow — stage 4 of 4 · VALIDATED CONTRACT
 * `request context → cache boundary → upstream client → [validated contract]`
 *
 * The single owner of the response shape: every payload — fixture today,
 * the backend via `apiClient` after the swap — passes through `newTodayResponseSchema`
 * before anything downstream sees it. Both consumers call this in-process —
 * Server Components through the cache boundary + RSC adapter, the browser
 * via the /api/v1/recommendations/today route handler. There is no HTTP hop
 * between a Server Component and this function, so contract and validation
 * stay identical on both paths.
 */
export async function getNewTodayResponse(input: GetNewTodayInput = {}): Promise<NewTodayResponse> {
  // ── Planned backend swap ──────────────────────────────────────────────
  // Replace the fixture block below with the upstream call. Service auth
  // (Bearer + API key) is attached by `apiClient` — only per-request
  // values appear here, as arguments:
  //
  // return await apiClient.get("/recommendations/today", {
  //   params: { zip: input.zipCode ?? undefined },
  //   ids: input.trackingIds,
  //   schema: newTodayResponseSchema,
  // });
  // ──────────────────────────────────────────────────────────────────────

  const resolvedFixture = toFixture(input.fixture);
  const payload =
    resolvedFixture === "empty" ? NEW_TODAY_EMPTY_RESPONSE : NEW_TODAY_SUCCESS_RESPONSE;

  const parsed = newTodayResponseSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("[getNewTodayResponse] Invalid New Today payload", parsed.error.issues);
    return NEW_TODAY_VALIDATION_ERROR_RESPONSE;
  }

  return parsed.data;
}
