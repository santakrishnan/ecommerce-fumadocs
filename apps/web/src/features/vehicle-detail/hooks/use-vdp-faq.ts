"use client";

import type { AgentSearchTurn, SubmitTurnOptions, TurnProvider } from "@features/search";
import { useEffect, useRef, useState } from "react";

import { useBffFaqTurns } from "./use-vdp-faq-bff-turns";

/**
 * Turn provider for the VDP FAQ overlay.
 *
 * All turns are query-driven (initial + follow-up pills + typed queries),
 * fetched from the VDP FAQ BFF endpoint for a deterministic demo flow.
 *
 * Plan-only turns (card-driven refinements) are not supported because all
 * VDP FAQ cards are `isReadOnly: true` and the overlay is read-only — users
 * cannot click cards to drill down. If cards become interactive in a future
 * story, this hook will need an SSE integration with `submitAgentTurn`.
 *
 * Returns the `TurnProvider` shape so it can be passed to
 * `SearchResultsOrchestratorWrapper` via the `turnProvider` prop.
 */
export function useVdpFaqTurns(vin: string): TurnProvider {
  const [searchId] = useState(() => crypto.randomUUID());
  const [turns, setTurns] = useState<AgentSearchTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const submitBffTurn = useBffFaqTurns(vin, searchId, abortRef, setTurns);

  const visibleTurns = turns.filter((t) => t.status !== "aborted");

  const lastTurn = visibleTurns.at(-1);
  const isStreaming = lastTurn?.status === "pending" || lastTurn?.status === "streaming";

  function cancel() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    []
  );

  function submitTurn(options: SubmitTurnOptions) {
    const query = options.query?.trim();

    // Guard: skip if no query, or a turn is already in flight.
    // Plan-only turns (no query, only filters/plan) are not supported — all
    // VDP FAQ cards are read-only and non-clickable in this overlay.
    if (!query || isStreaming) {
      return;
    }

    cancel();
    const controller = new AbortController();
    abortRef.current = controller;

    submitBffTurn(query, controller);
  }

  return { turns: visibleTurns, isLoading: false, isStreaming: !!isStreaming, submitTurn };
}
