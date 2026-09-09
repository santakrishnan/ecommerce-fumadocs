"use client";

import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import { devConsole } from "@shared/lib/dev-console";
import { eq, not, useLiveQuery } from "@tanstack/react-db";
import { useRef } from "react";
import { useSearchConversationalContext } from "../context/search-conversational-context";
import type {
  AgentSearchTurn,
  NextSearchPlan as NextSearchPlanType,
} from "../lib/agent-search-turns-collection";
import { getCurrentRowContext } from "../lib/response-cards";
import {
  type AgentSearchLocation,
  SearchNotFoundError,
  submitAgentTurn,
} from "../services/agent-search-service";
import { useAgentSearchTurnsCollection } from "./use-agent-search-turns-collection";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { NextSearchPlan } from "../lib/agent-search-turns-collection";

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

export interface UseAgentSearchTurnsResult {
  /** Cancel any in-flight request. */
  cancel: () => void;
  /** True while the collection is reading initial state from IDB. */
  isLoading: boolean;
  /** True when the most recent turn is pending or streaming. */
  isStreaming: boolean;
  /**
   * Mark a turn's full reveal as played (idempotent). Persists to IDB so the
   * reveal never replays for that turn on reload, back-navigation, or remount.
   */
  markTurnAnimated: (turnId: string) => void;
  /**
   * Submit a new turn. Always sends filters (from the last response's
   * nextSearchPlan, or an explicit override for card clicks).
   * No-op if another turn is already in flight.
   */
  submitTurn: (options: SubmitTurnOptions) => void;
  /**
   * All non-aborted turns for this session, chronological (oldest first).
   * Aborted turns are excluded from the rendered thread but kept in IDB.
   */
  turns: AgentSearchTurn[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAgentSearchTurnsOptions {
  onSearchNotFound?: () => void;
}

/**
 * Provides the full conversational thread for a given searchId.
 *
 * Read path: useLiveQuery against agentSearchTurnsCollection, filtered to
 * this session, excluding aborted turns, ordered chronologically.
 *
 * Write path: submitTurn() → submitAgentTurn() service → collection mutations.
 * All intermediate state (pending, streaming, complete) flows through the
 * collection — this hook has no useState of its own.
 *
 * On boot, any turns left in "pending" or "streaming" state are normalised
 * to "aborted" by the collection's transformOnLoad — they will never resolve.
 *
 * Filter continuity: every submission includes filters from the conversation's
 * latest response-level nextSearchPlan. This keeps the agent informed of the
 * accumulated filter state. Card clicks override with their own card-level plan.
 *
 * @param searchId - The conversation session UUID. Minted by the caller
 *   and held stable across the session.
 */
export function useAgentSearchTurns(
  searchId: string,
  options: UseAgentSearchTurnsOptions = {}
): UseAgentSearchTurnsResult {
  const abortControllerRef = useRef<AbortController | null>(null);
  const collection = useAgentSearchTurnsCollection();
  const { onSearchNotFound } = options;
  const agentVersion = useSearchConversationalContext()?.agentVersion ?? DEFAULT_AGENT_VERSION;

  const { data: turns = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ t: collection })
        .where(({ t }) => eq(t.searchId, searchId))
        .where(({ t }) => not(eq(t.status, "aborted")))
        .where(({ t }) => not(eq(t.status, "queued")))
        .orderBy(({ t }) => t.submittedAt, "asc"),
    [searchId, collection]
  );

  const lastTurn = turns.at(-1);
  const isStreaming = !!(lastTurn?.status === "pending" || lastTurn?.status === "streaming");

  // Response-level nextSearchPlan from the last completed turn — the
  // accumulated filter context the agent expects on subsequent turns.
  const lastResponsePlan =
    lastTurn?.status === "complete" ? lastTurn.response?.nextSearchPlan : undefined;

  // React Compiler handles memoisation — no useCallback needed.
  function cancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }

  // React Compiler handles memoisation — no useCallback needed.
  function markTurnAnimated(turnId: string) {
    try {
      collection.update(turnId, (draft) => {
        draft.animationPlayed = true;
      });
    } catch {
      // Turn not in the collection (e.g. already evicted) — nothing to mark.
    }
  }

  // React Compiler handles memoisation — no useCallback needed.
  function submitTurn(options: SubmitTurnOptions) {
    const { query, location, filters, plan, refinementNotification, autoSubmitted, label, source } =
      options;

    const trimmedQuery = query?.trim() || undefined;

    // Must have either a query, an explicit plan (card click — even with empty
    // filters, e.g. "Browse all inventory"), or explicit filters override.
    if (!(trimmedQuery || plan?.searchId || filters?.length)) {
      return;
    }

    if (isStreaming) {
      return;
    }

    cancel();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Plan priority: explicit plan (card click) > last response plan.
    // Falls back to filters-only for backward compat.
    const resolvedPlan = plan ?? (filters ? { ...lastResponsePlan, filters } : lastResponsePlan);

    // Capture the current row so this turn can be classified as a follow-up
    // when it completes.
    const { anchorTurnId, canonicalCardIds, canonicalFilters } = getCurrentRowContext(turns);

    const submission = submitAgentTurn({
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
    });

    submission
      .catch((err: unknown) => {
        if (err instanceof SearchNotFoundError) {
          onSearchNotFound?.();
          return;
        }

        devConsole.error("[useAgentSearchTurns] submitTurn failed:", err);
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      });
  }

  return { turns, isLoading, isStreaming, submitTurn, cancel, markTurnAnimated };
}
