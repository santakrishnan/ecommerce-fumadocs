"use client";

import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import { devConsole } from "@shared/lib/dev-console";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSearchConversationalContext } from "../context/search-conversational-context";
import type {
  AgentSearchTurn,
  AgentSearchTurnsCollection,
  NextSearchPlan as NextSearchPlanType,
} from "../lib/agent-search-turns-collection";
import { getCurrentRowContext } from "../lib/response-cards";
import { type AgentSearchLocation, submitAgentTurn } from "../services/agent-search-service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitTurnOptions {
  /** Whether this turn was triggered programmatically (card click, recovery). */
  autoSubmitted?: boolean;
  /**
   * Explicit filters override. When provided (e.g. card click), these are sent
   * instead of the response-level nextSearchPlan filters from the last turn.
   * @deprecated Prefer `plan` — filters-only is kept for backward compat.
   */
  filters?: NextSearchPlanType["filters"];
  /**
   * Display label for the intent eyebrow when the turn has no query text —
   * e.g. the title of a clicked card.
   */
  label?: string;
  /** Visitor location (required by the API). */
  location: AgentSearchLocation;
  /**
   * Full nextSearchPlan override (card click). When provided, all fields
   * (filters, searchMode, responseMode, etc.) are forwarded to the API.
   * Takes priority over `filters`.
   */
  plan?: NextSearchPlanType;
  /** Freeform query text. Optional — card clicks have no query. */
  query?: string;
  /** Notification text for preference-removal refinement turns. */
  refinementNotification?: string;
  /** What triggered this turn (query/card/pill/filters/auto). */
  source: NonNullable<AgentSearchTurn["source"]>;
}

export interface UseEphemeralAgentSearchTurnsResult {
  /** Cancel any in-flight request. */
  cancel: () => void;
  /** Always false — no IDB loading phase in ephemeral mode. */
  isLoading: false;
  /** True when the most recent turn is pending or streaming. */
  isStreaming: boolean;
  /** Mark a turn's full reveal as played (idempotent, in-memory only). */
  markTurnAnimated: (turnId: string) => void;
  /** The session ID minted on mount. */
  searchId: string;
  /** Submit a new conversational turn. */
  submitTurn: (options: SubmitTurnOptions) => void;
  /** All non-aborted turns for this session, chronological (oldest first). */
  turns: AgentSearchTurn[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Ephemeral variant of useAgentSearchTurns — holds all turn state in React
 * component state instead of IDB. Designed for the VDP overlay where
 * persistence is not needed: state is discarded on unmount.
 */
export function useEphemeralAgentSearchTurns(): UseEphemeralAgentSearchTurnsResult {
  const [searchId] = useState(() => crypto.randomUUID());
  const [turns, setTurns] = useState<AgentSearchTurn[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const agentVersion = useSearchConversationalContext()?.agentVersion ?? DEFAULT_AGENT_VERSION;

  // In-memory collection adapter — satisfies AgentSearchTurnsCollection interface.
  const collection = useMemo(
    () =>
      ({
        insert(turn: AgentSearchTurn) {
          setTurns((prev) => [...prev, turn]);
        },
        update(id: string, updater: (draft: AgentSearchTurn) => void) {
          setTurns((prev) =>
            prev.map((t) => {
              if (t.id !== id) {
                return t;
              }
              const draft = { ...t };
              updater(draft);
              return draft;
            })
          );
        },
        delete(id: string) {
          setTurns((prev) => prev.filter((t) => t.id !== id));
        },
      }) as unknown as AgentSearchTurnsCollection,
    []
  );

  // Filter out aborted turns from the rendered thread.
  const visibleTurns = useMemo(() => turns.filter((t) => t.status !== "aborted"), [turns]);

  const lastTurn = visibleTurns.at(-1);
  const isStreaming = !!(lastTurn?.status === "pending" || lastTurn?.status === "streaming");

  // Response-level nextSearchPlan from the last completed turn.
  const lastResponsePlan =
    lastTurn?.status === "complete" ? lastTurn.response?.nextSearchPlan : undefined;

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const markTurnAnimated = useCallback(
    (turnId: string) => {
      collection.update(turnId, (draft) => {
        draft.animationPlayed = true;
      });
    },
    [collection]
  );

  // Abort any in-flight request when the component unmounts (e.g. overlay closes).
  useEffect(() => cancel, [cancel]);

  const submitTurn = useCallback(
    (options: SubmitTurnOptions) => {
      const {
        query,
        location,
        filters,
        plan,
        refinementNotification,
        autoSubmitted,
        label,
        source,
      } = options;

      const trimmedQuery = query?.trim() || undefined;

      if (!(trimmedQuery || plan?.filters?.length || filters?.length)) {
        return;
      }

      if (isStreaming) {
        return;
      }

      cancel();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const resolvedPlan = plan ?? (filters ? { ...lastResponsePlan, filters } : lastResponsePlan);

      const { anchorTurnId, canonicalCardIds, canonicalFilters } =
        getCurrentRowContext(visibleTurns);

      submitAgentTurn({
        query: trimmedQuery,
        searchId,
        location,
        signal: controller.signal,
        collection,
        refinementNotification,
        autoSubmitted,
        label,
        source,
        anchorTurnId,
        canonicalCardIds,
        canonicalFilters,
        plan: resolvedPlan,
        agentVersion,
      })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") {
            devConsole.error("[useEphemeralAgentSearchTurns] submitTurn failed:", err);
          }
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        });
    },
    [searchId, isStreaming, cancel, collection, lastResponsePlan, visibleTurns, agentVersion]
  );

  return {
    cancel,
    isLoading: false,
    isStreaming,
    markTurnAnimated,
    searchId,
    submitTurn,
    turns: visibleTurns,
  };
}
