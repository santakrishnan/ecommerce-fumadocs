"use client";

import { createContext, type ReactNode, use, useEffect, useState } from "react";

export interface VisitorIdentity {
  sessionId: string | null;
  visitorId: string | null;
}

interface VisitorContextValue extends VisitorIdentity {
  /** Merge in resolved identity fields (from the SSR seed or the keep-alive). */
  setIdentity: (next: Partial<VisitorIdentity>) => void;
}

function noopSetIdentity(): void {
  // Default before a VisitorProvider mounts — consumers get the anonymous fallback.
}

const DEFAULT_VISITOR_CONTEXT: VisitorContextValue = {
  sessionId: null,
  visitorId: null,
  setIdentity: noopSetIdentity,
};

const VisitorContext = createContext<VisitorContextValue>(DEFAULT_VISITOR_CONTEXT);

/**
 * Holds the visitor identity (`visitorId` / `sessionId`) resolved by the Visitor
 * Profile Service `/resolve`, for client components that can't read the httpOnly
 * identity cookies. Seeded server-side from those cookies (`VisitorIdentitySeeder`)
 * and patched by `SessionKeepAlive` when `/resolve` returns — so the IndexedDB
 * partition key uses the real visitor id instead of a shared constant.
 */
export function VisitorProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<VisitorIdentity>({
    sessionId: null,
    visitorId: null,
  });

  const setIdentity = (next: Partial<VisitorIdentity>) => {
    setIdentityState((prev) => {
      const visitorId = next.visitorId ?? prev.visitorId;
      const sessionId = next.sessionId ?? prev.sessionId;
      // No-op when unchanged — avoids re-partitioning the IndexedDB collections.
      if (visitorId === prev.visitorId && sessionId === prev.sessionId) {
        return prev;
      }
      return { sessionId, visitorId };
    });
  };

  return <VisitorContext value={{ ...identity, setIdentity }}>{children}</VisitorContext>;
}

/** Read the visitor identity + setter. Returns nulls when no provider is mounted. */
export function useVisitorIdentity(): VisitorContextValue {
  return use(VisitorContext);
}

/**
 * Applies a server-read identity seed to the context on mount. Rendered by the
 * server-only `VisitorIdentitySeeder` so a warm visitor's id is available from
 * the first client render, without waiting for the keep-alive `/resolve`.
 */
export function HydrateVisitorIdentity({ sessionId, visitorId }: VisitorIdentity) {
  const { setIdentity } = useVisitorIdentity();

  useEffect(() => {
    setIdentity({ sessionId, visitorId });
  }, [sessionId, visitorId, setIdentity]);

  return null;
}
