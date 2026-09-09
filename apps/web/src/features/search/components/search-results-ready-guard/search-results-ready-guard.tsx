"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";

/**
 * SearchResultsReadyGuard — renders children only when results are ready.
 * Hidden during "loading" state; revealed on "suggestion-selected" or "refinement".
 */
export function SearchResultsReadyGuard({ children }: { children: React.ReactNode }) {
  const ctx = useSearchConversationalContext();
  const showResults = ctx?.showSaveSearchToggle ?? false;

  if (!showResults) {
    return null;
  }

  return <>{children}</>;
}
