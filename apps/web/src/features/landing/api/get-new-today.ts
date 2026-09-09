import "server-only";

import type { NewTodaySuccessResponse } from "@features/landing/data/schemas";
import { getNewTodayResponse } from "@features/landing/services/get-new-today-response";

/**
 * Feature API helper for New Today, called from Server Components.
 *
 * New Today flow — bridge between stages 2 and 4 · RSC ADAPTER
 * `request context → cache boundary → [·] upstream client → validated contract`
 *
 * Thin seam between the cache boundary and the validated contract, RSC path
 * only (the route handler front door calls the contract directly). Converts
 * the contract's error-union into throw-or-data so cached callers stay
 * simple. Deliberately kept even while thin: when the real backend upstream
 * lands, this signature is the part that does NOT change.
 *
 * Calls the shared use case in-process — never our own /api/v1 route over
 * HTTP (self-fetch adds a network hop, drops cookies, and hangs during
 * build/ISR). The route handler exists for browser-originated calls only;
 * both paths share `getNewTodayResponse`, so contract and validation stay
 * identical. When the real backend upstream lands, swap the use case internals —
 * this signature stays.
 *
 * @param zipCode Visitor ZIP read from the location cookie by the caller,
 * outside any `"use cache"` scope.
 */
export async function getNewToday(zipCode: string | null = null): Promise<NewTodaySuccessResponse> {
  const response = await getNewTodayResponse({ zipCode });

  if ("error" in response) {
    throw new Error(response.error.message);
  }

  return response;
}
