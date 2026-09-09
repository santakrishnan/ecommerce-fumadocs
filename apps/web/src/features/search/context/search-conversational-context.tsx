"use client";

import type { AgentVersion } from "@config/agent-backend";
import { createContext, use, useState } from "react";
import type { SearchAgentMode, SearchConversationalState } from "../types/search-state";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchConversationalProps {
  /** The agent persona this session is running under. Read-only after mount. */
  agentMode: SearchAgentMode;
  /**
   * The upstream agent version resolved server-side from the
   * `demo-agent-backend` cookie (or env default). Read-only after mount —
   * echoed back on every `submitAgentTurn` POST body as `agentVersion`.
   */
  agentVersion: AgentVersion;
  /** Derived: true once a prompt has been submitted (persists after loading). */
  hasSubmittedPrompt: boolean;
  /** Derived: true while in the "loading" state. */
  isLoading: boolean;
  /** Derived: true while in the "query-initialized" blank-page state. */
  isQueryInitialized: boolean;
  /** Full state machine state. */
  searchConversationalState: SearchConversationalState;
  /** Derived: true only before any prompt is submitted. */
  showLocationPill: boolean;
  /** Derived: true when results are ready (results-generated, no-matching, or refinement). */
  showSaveSearchToggle: boolean;
}

interface SearchConversationalContextValue extends SearchConversationalProps {
  setSearchConversationalState: (state: SearchConversationalState) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SearchConversationalContext = createContext<SearchConversationalContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SearchConversationalProviderProps {
  children: React.ReactNode;
  /**
   * The agent persona this session runs under. Set once at mount; does not change
   * for the lifetime of the session. Defaults to "general".
   */
  initialAgentMode?: SearchAgentMode;
  /**
   * The resolved upstream agent version, passed down from a Server Component
   * that already called `resolveAgentBackend()` + `resolveAgentVersion()`.
   * Set once at mount. Defaults to "v2".
   */
  initialAgentVersion?: AgentVersion;
  /**
   * Seed the state when navigating directly to /search/[id].
   * "results-generated" means results are already available.
   */
  initialState?: SearchConversationalState;
}

export function SearchConversationalProvider({
  children,
  initialAgentMode = "general",
  initialAgentVersion = "v2",
  initialState = "idle",
}: SearchConversationalProviderProps) {
  const [agentMode] = useState<SearchAgentMode>(initialAgentMode);
  const [agentVersion] = useState<AgentVersion>(initialAgentVersion);
  const [searchState, setSearchState] = useState<SearchConversationalState>(initialState);

  const isLoading = searchState === "loading";
  const isQueryInitialized = searchState === "query-initialized";
  const hasSubmittedPrompt =
    searchState === "query-initialized" ||
    searchState === "loading" ||
    searchState === "submitted" ||
    searchState === "results-generated" ||
    searchState === "refinement";
  const showLocationPill = !hasSubmittedPrompt;
  const showSaveSearchToggle = searchState === "results-generated" || searchState === "refinement";

  return (
    <SearchConversationalContext
      value={{
        agentMode,
        agentVersion,
        hasSubmittedPrompt,
        isLoading,
        isQueryInitialized,
        searchConversationalState: searchState,
        setSearchConversationalState: setSearchState,
        showLocationPill,
        showSaveSearchToggle,
      }}
    >
      {children}
    </SearchConversationalContext>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSearchConversationalContext — consume the search conversational state.
 * Returns null when used outside the provider (graceful fallback).
 */
export function useSearchConversationalContext(): SearchConversationalContextValue | null {
  return use(SearchConversationalContext);
}
