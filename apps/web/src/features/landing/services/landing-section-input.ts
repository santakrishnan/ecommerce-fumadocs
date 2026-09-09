/**
 * Shared input shape for landing section services that require location
 * context and visitor identity.
 *
 * Read from cookies + `readVisitorIdentity()` OUTSIDE any `"use cache"` scope
 * by the calling Server Component, then passed as plain arguments to the
 * cached service — becoming part of the cache key (non-secret primitives only).
 */
export interface LandingSectionInput {
  latitude: number | null;
  longitude: number | null;
  sessionId: string | null;
  visitorId: string | null;
  zipCode: string | null;
}
