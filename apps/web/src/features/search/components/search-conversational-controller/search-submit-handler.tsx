"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";
import { useAgentSearchTurnsCollection } from "@features/search/hooks/use-agent-search-turns-collection";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SearchLoadingIndicator } from "~/features/search/components/search-loading-indicator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchSubmitHandlerProps {
  /** Whether this handler may act on the settled turn, including error recovery. */
  canNavigate?: boolean;
  /** Called when the watched turn settles with an error instead of navigating. */
  onError?: () => void;
  query: string;
  searchId: string;
  turnId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SearchSubmitHandler — watches a single in-flight turn by turnId and
 * navigates to /search/[searchId] once it settles.
 *
 * Does not submit anything — submission happens in SearchConversationalController from the
 * user event handler. This component only reads from the collection.
 *
 * Rendered via SearchSubmitHandlerWrapper (ssr:false).
 */
export function SearchSubmitHandler({
  canNavigate = true,
  onError,
  query,
  searchId,
  turnId,
}: SearchSubmitHandlerProps) {
  const ctx = useSearchConversationalContext();
  const router = useRouter();
  const collection = useAgentSearchTurnsCollection();

  const { data: liveTurns = [] } = useLiveQuery(
    (q) => q.from({ t: collection }).where(({ t }) => eq(t.id, turnId)),
    [collection, turnId]
  );
  const liveTurn = liveTurns[0];
  const isComplete = liveTurn?.status === "complete";
  const isError = liveTurn?.status === "error";
  const shouldNavigate = canNavigate && isComplete;
  const shouldRecoverError = canNavigate && isError;

  useEffect(() => {
    if (shouldNavigate) {
      ctx?.setSearchConversationalState("results-generated");
      router.push(`/search/${searchId}`);
      return;
    }
    if (shouldRecoverError) {
      ctx?.setSearchConversationalState("typing");
      onError?.();
    }
  }, [shouldNavigate, shouldRecoverError, searchId, ctx, router, onError]);

  return (
    <div className="col-span-full flex flex-col gap-12 lg:col-start-2">
      <p className="body-xl text-left text-text-primary" data-surface="dark">
        {query}
      </p>
      <SearchLoadingIndicator beats={liveTurn?.beats} thinkingStatus="Working on it..." />
    </div>
  );
}
