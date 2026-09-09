"use client";

import { API_ROUTES } from "@config/routes/constants";
import { useFingerprint } from "@features/fingerprint";
import { useVisitorIdentity } from "@shared/providers/visitor-provider";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const RESOLVE_URL = API_ROUTES.PROFILE_RESOLVE;
const SESSION_KEEP_ALIVE_KEY = ["session", "keep-alive"] as const;

interface ResolvedIdentity {
  sessionId: string;
  visitorId: string;
}

/**
 * Heartbeat cadence. Kept well below the Visitor Profile Service session idle
 * timeout so a visitor parked on a single page never lapses. Tune to the
 * server's configured session TTL if it changes.
 */
const HEARTBEAT_MS = 5 * 60_000;

/**
 * Minimum gap between navigation-triggered pings. Rapid soft navigations within
 * this window ride on the previous ping instead of spamming `/resolve` —
 * `lastSeenAt` is already fresh enough.
 */
const NAV_THROTTLE_MS = 30_000;

/**
 * Fire-and-forget session extension. Never throws — a miss is picked up by the
 * next heartbeat, and every ping resolves (even a failure) so TanStack Query
 * advances `dataUpdatedAt`, which the navigation throttle reads.
 *
 * Returns the resolved `{ visitorId, sessionId }` on HTTP 200 (so it can be
 * pushed into the visitor context for client-side partitioning), or `null` on
 * the cold-start 204 no-op (no fingerprint cookie yet) or any error. The caller
 * uses `null` to fire a resolve the moment the fingerprint becomes available.
 */
async function extendSession(signal?: AbortSignal): Promise<ResolvedIdentity | null> {
  try {
    const response = await fetch(RESOLVE_URL, { method: "GET", signal });
    if (!response.ok || response.status === 204) {
      return null;
    }
    const body: unknown = await response.json();
    const data = (body as { data?: { visitorId?: unknown; sessionId?: unknown } }).data;
    if (typeof data?.visitorId === "string" && typeof data?.sessionId === "string") {
      return { sessionId: data.sessionId, visitorId: data.visitorId };
    }
    return null;
  } catch {
    // Session extension failures never affect the UI.
    return null;
  }
}

/**
 * Keeps the Visitor Profile Service session warm and advances `lastSeenAt`.
 *
 * Three triggers, one endpoint — `GET /resolve` both extends the session and
 * bumps `lastSeenAt`:
 * - **Fingerprint-ready** — on a cold visit the mount ping 204s (no fingerprint
 *   cookie yet); the moment the fingerprint resolves, fire one resolve so the
 *   session is established in seconds, not at the next heartbeat.
 * - **Heartbeat** — a `refetchInterval` ping every {@link HEARTBEAT_MS} so an
 *   idle-but-present visitor (e.g. reading one long page) never lapses. Skips
 *   backgrounded tabs and re-warms on tab focus, both handled by TanStack
 *   Query.
 * - **Navigation** — a throttled ping on each `usePathname()` change (incl.
 *   soft navigations) so active browsing advances `lastSeenAt` promptly.
 *
 * Renders nothing. Must mount inside `QueryProvider` and `FingerprintProvider`
 * (it does, via the root layout's composed providers).
 */
export function SessionKeepAlive() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const { isReady } = useFingerprint();
  const { setIdentity } = useVisitorIdentity();

  const { refetch, dataUpdatedAt, data } = useQuery({
    queryKey: SESSION_KEEP_ALIVE_KEY,
    queryFn: ({ signal }) => extendSession(signal),
    refetchInterval: HEARTBEAT_MS,
    // An idle hidden tab isn't an "active" visitor — don't ping it.
    refetchIntervalInBackground: false,
    // Re-warm the session when the visitor returns to the tab.
    refetchOnWindowFocus: true,
  });

  // Surface the resolved identity to client components — the IndexedDB
  // collections read it (via useVisitorId) to partition per visitor. No-op
  // guarded in the provider, so an unchanged identity never re-partitions.
  useEffect(() => {
    if (data) {
      setIdentity(data);
    }
  }, [data, setIdentity]);

  // Cold start: the mount ping 204s because the fingerprint cookie isn't set
  // yet. As soon as the fingerprint resolves — its enrich response sets the
  // cookie in the same round-trip — fire one resolve immediately, rather than
  // waiting for the 5-min heartbeat or a navigation. Gated on `data === null`
  // (the last ping was the 204 no-op), so a warm visit that already resolved on
  // mount never double-fires. Off the render path; a failure rides the heartbeat.
  useEffect(() => {
    if (isReady && data === null) {
      refetch();
    }
  }, [isReady, data, refetch]);

  useEffect(() => {
    // Initial mount: the query's own first fetch already pinged. Just record
    // the path so subsequent navigations are detected.
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }
    if (lastPathRef.current === pathname) {
      return;
    }
    lastPathRef.current = pathname;

    // Throttle against the last successful ping (heartbeat, focus, or nav).
    if (dataUpdatedAt === 0 || Date.now() - dataUpdatedAt < NAV_THROTTLE_MS) {
      return;
    }
    refetch();
  }, [pathname, dataUpdatedAt, refetch]);

  return null;
}
