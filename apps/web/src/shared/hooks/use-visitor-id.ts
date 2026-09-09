"use client";

import { useVisitorIdentity } from "@shared/providers/visitor-provider";

/**
 * Partition id used before the visitor is resolved (cold start / pre-resolve),
 * or when no `VisitorProvider` is mounted. Client-only collections fall back to
 * this until `/resolve` yields the real id.
 */
export const ANONYMOUS_VISITOR_ID = "00000000-0000-0000-0000-000000000001";

/**
 * The current visitor's stable id for client-side partitioning (the IndexedDB
 * collections' partition key). Returns the real VPS `visitorId` once resolved —
 * SSR-seeded from the identity cookie, then patched by `SessionKeepAlive` — else
 * the anonymous fallback.
 */
export function useVisitorId(): string {
  return useVisitorIdentity().visitorId ?? ANONYMOUS_VISITOR_ID;
}
