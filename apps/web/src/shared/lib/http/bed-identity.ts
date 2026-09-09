import "server-only";

import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { cookies } from "next/headers";
import type { BedVisitorIdentity } from "./bed-client";

/**
 * Read the visitor identity that the Visitor Profile Service `/resolve` call
 * persisted into the tracking cookies (`_ucmp_visitor_id` / `_ucmp_session_id`).
 *
 * Pass the result to `createBedClient(service, identity)` so any downstream BED
 * call — search, profile, recommendations — forwards the same
 * `X-Visitor-Id` / `X-Session-Id`. Returns nulls before the first resolve
 * (cold visit), which simply omits the headers.
 *
 * Call this OUTSIDE any `"use cache"` scope (it reads request cookies) and hand
 * the value down as an argument.
 */
export async function readVisitorIdentity(): Promise<BedVisitorIdentity> {
  const store = await cookies();
  return {
    visitorId: store.get(TRACKING_COOKIE.VISITOR_ID)?.value ?? null,
    sessionId: store.get(TRACKING_COOKIE.SESSION_ID)?.value ?? null,
  };
}
