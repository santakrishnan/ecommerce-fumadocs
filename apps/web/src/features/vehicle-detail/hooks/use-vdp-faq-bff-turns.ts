"use client";

import type { AgentSearchTurn } from "@features/search";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { fetchVdpFaq } from "../services/vdp-faq-client";
import { mapBffToTurn } from "./vdp-faq-mapper";

/**
 * Handles BFF query-driven turns for the VDP FAQ overlay.
 *
 * Responsible for:
 * - Adding a pending turn immediately for optimistic feedback
 * - Fetching the BFF FAQ endpoint for the given query
 * - Settling the turn to `complete`, `aborted`, or `error`
 *
 * `abortRef` is owned by the orchestrator (`useVdpFaqTurns`) and is cleared
 * here in `.finally` once the fetch resolves or rejects.
 */
export function useBffFaqTurns(
  vin: string,
  searchId: string,
  abortRef: RefObject<AbortController | null>,
  setTurns: Dispatch<SetStateAction<AgentSearchTurn[]>>
) {
  function submitBffTurn(query: string, controller: AbortController) {
    const turnId = crypto.randomUUID();

    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        searchId,
        role: "user" as const,
        query,
        status: "pending" as const,
        submittedAt: Date.now(),
      },
    ]);

    fetchVdpFaq(vin, query, controller.signal)
      .then((bff) => {
        if (controller.signal.aborted) {
          return;
        }
        const completeTurn = mapBffToTurn(turnId, searchId, query, bff);
        setTurns((prev) => prev.map((t) => (t.id === turnId ? completeTurn : t)));
      })
      .catch((err: unknown) => {
        if ((err instanceof Error && err.name === "AbortError") || controller.signal.aborted) {
          setTurns((prev) =>
            prev.map((t) => (t.id === turnId ? { ...t, status: "aborted" as const } : t))
          );
          return;
        }
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, status: "error" as const } : t))
        );
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  }

  return submitBffTurn;
}
