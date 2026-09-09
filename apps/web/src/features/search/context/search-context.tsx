"use client";

import { createContext, use } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

// Placeholder — extend when real search state is wired in.
// biome-ignore lint/complexity/noBannedTypes: intentional empty interface, will be extended
type SearchContextValue = {};

// ─── Context ──────────────────────────────────────────────────────────────────

const SearchContext = createContext<SearchContextValue | null>(null);

// Module-level constant — stable reference, no unnecessary consumer re-renders.
const SEARCH_CONTEXT_VALUE: SearchContextValue = {};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SearchProvider({ children }: { children: React.ReactNode }) {
  return <SearchContext value={SEARCH_CONTEXT_VALUE}>{children}</SearchContext>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSearchContext(): SearchContextValue | null {
  return use(SearchContext);
}
