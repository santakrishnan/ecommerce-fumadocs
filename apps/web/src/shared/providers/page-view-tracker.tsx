"use client";

import { recordActivityClient, resolvePageType } from "@features/profile/activities/client";
import { useVisitorIdentity } from "@shared/providers/visitor-provider";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Records a `visitorActivity.page.viewed` event on every navigation,
 * including client-side route changes without a full page reload.
 *
 * Rules:
 * - Fire-and-forget: a failed call is logged but never blocks navigation.
 * - Identity guard: nothing is recorded until both `visitorId` and `sessionId`
 *   are non-null (i.e. the visitor's identity has resolved from `/resolve`).
 * - The activity call goes through the BFF route (`POST /api/v1/profile/activities`),
 *   which reads identity from httpOnly cookies — the client payload's visitorId /
 *   sessionId satisfies the SDK schema requirement; the BFF re-reads from cookies
 *   independently for upstream forwarding.
 * - `referrerPageType` is omitted on the first page load (no prior pathname).
 *
 * Renders nothing. Mount inside `<Suspense fallback={null}>` in the root layout,
 * alongside `SessionKeepAlive`.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { visitorId, sessionId } = useVisitorIdentity();

  // Track the previous pathname so we can derive referrerPageType on navigation.
  // Initialised to null so the first mount is distinguishable from subsequent navigations.
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for identity and only record actual pathname transitions.
    if (!(visitorId && sessionId) || prevPathnameRef.current === pathname) {
      return;
    }

    const pageType = resolvePageType(pathname);
    const referrerPageType =
      prevPathnameRef.current === null ? undefined : resolvePageType(prevPathnameRef.current);

    prevPathnameRef.current = pathname;

    // Fire-and-forget — errors are caught and logged; never block navigation.
    recordActivityClient({
      type: "visitorActivity.page.viewed",
      visitorId,
      sessionId,
      pageType,
      pageUrl: pathname,
      ...(referrerPageType === undefined ? {} : { referrerPageType }),
    }).catch((err: unknown) => {
      console.error(
        "[PageViewTracker] Failed to record page.viewed activity:",
        err instanceof Error ? err.message : err
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally excludes prevPathnameRef — it's a stable ref, not reactive state.
  }, [pathname, visitorId, sessionId]);

  return null;
}
