"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";

/**
 * SearchLoadingContent — renders children only while context is in "loading" state.
 * Hidden once state moves to "results-generated", "refinement", or back to "idle".
 */
export function SearchLoadingContent({ children }: { children: React.ReactNode }) {
  const ctx = useSearchConversationalContext();
  const isLoading = ctx?.isLoading ?? false;

  if (!isLoading) {
    return null;
  }

  return <>{children}</>;
}
