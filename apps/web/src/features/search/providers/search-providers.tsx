"use client";

import type { AgentVersion } from "@config/agent-backend";
import { SearchProvider } from "@features/search/context/search-context";
import {
  SearchConversationalProvider,
  useSearchConversationalContext,
} from "@features/search/context/search-conversational-context";
import type {
  SearchAgentMode,
  SearchConversationalState,
} from "@features/search/types/search-state";
import { usePathname } from "next/navigation";
import { Suspense, use, useEffect } from "react";

interface SearchProvidersProps {
  children: React.ReactNode;
  /** Agent persona for the session. Defaults to "general". */
  initialAgentMode?: SearchAgentMode;
  /**
   * Resolved upstream agent version. A Server Component may pass a
   * `Promise<AgentVersion>` (resolved from the httpOnly `demo-agent-backend`
   * cookie); it's unwrapped with `use()` inside this module's Suspense boundary
   * so the cookie read never blocks the prerendered shell. Defaults to "v2".
   */
  initialAgentVersion?: AgentVersion | Promise<AgentVersion>;
}

function isPromise(value: unknown): value is Promise<AgentVersion> {
  return typeof (value as { then?: unknown } | undefined)?.then === "function";
}

/**
 * Derives the correct initial state from pathname so the provider never
 * starts in "idle" on /search/[id] — eliminates the single-frame flicker.
 */
function deriveInitialState(pathname: string): SearchConversationalState {
  if (!pathname) {
    return "idle";
  }
  const segments = pathname.split("/").filter(Boolean);
  const searchIdx = segments.indexOf("search");
  return searchIdx !== -1 && segments.length > searchIdx + 1 ? "results-generated" : "idle";
}

/**
 * Handles soft-navigation state transitions (back/forward).
 * Wrapped in Suspense so usePathname doesn't block PPR shell.
 */
function SearchConversationalStateSeeder() {
  const pathname = usePathname();
  const ctx = useSearchConversationalContext();

  const segments = pathname.split("/").filter(Boolean);
  const searchIdx = segments.indexOf("search");
  const hasSearchId = searchIdx !== -1 && segments.length > searchIdx + 1;

  useEffect(() => {
    if (!ctx) {
      return;
    }

    if (hasSearchId) {
      if (ctx.searchConversationalState === "idle") {
        ctx.setSearchConversationalState("results-generated");
      }
    } else {
      ctx.setSearchConversationalState("idle");
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * Reads pathname and passes the derived initialState to the provider.
 * Wrapped in <Suspense> because usePathname is uncached (PPR requirement).
 */
function SearchProvidersInner({
  children,
  initialAgentMode,
  initialAgentVersion,
}: SearchProvidersProps) {
  const pathname = usePathname();
  const initialState = deriveInitialState(pathname);
  // Unwrap the version here — inside SearchProviders' Suspense — so a
  // cookie-derived promise from the Server Component never blocks the shell.
  const resolvedAgentVersion = isPromise(initialAgentVersion)
    ? use(initialAgentVersion)
    : initialAgentVersion;

  return (
    <SearchConversationalProvider
      initialAgentMode={initialAgentMode}
      initialAgentVersion={resolvedAgentVersion}
      initialState={initialState}
    >
      <Suspense>
        <SearchConversationalStateSeeder />
      </Suspense>
      {children}
    </SearchConversationalProvider>
  );
}

/**
 * SearchProviders — composes all client providers for the search route.
 */
export function SearchProviders({
  children,
  initialAgentMode,
  initialAgentVersion,
}: SearchProvidersProps) {
  return (
    <SearchProvider>
      <Suspense>
        <SearchProvidersInner
          initialAgentMode={initialAgentMode}
          initialAgentVersion={initialAgentVersion}
        >
          {children}
        </SearchProvidersInner>
      </Suspense>
    </SearchProvider>
  );
}
