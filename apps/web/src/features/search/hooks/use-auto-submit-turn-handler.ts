"use client";

import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import { devConsole } from "@shared/lib/dev-console";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useEffect, useRef } from "react";
import { useSearchConversationalContext } from "../context/search-conversational-context";
import { isMockNotFoundSearchId } from "../lib/mock-not-found-search-ids";
import {
  type AgentSearchLocation,
  SearchNotFoundError,
  submitAgentTurn,
} from "../services/agent-search-service";
import { useAgentSearchTurnsCollection } from "./use-agent-search-turns-collection";

// ─── Constants ────────────────────────────────────────────────────────────────

/** RFC 4122 UUID v4 pattern — used to guard against non-UUID route params. */
const UUID_V4_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAutoSubmitTurnHandlerOptions {
  /**
   * Query to auto-submit when no turns exist and no queued turn is found.
   * Used by consumers that want to seed a first turn without the IDB pre-seed pattern.
   */
  initialQuery?: string;
  /** Location to pass to submitAgentTurn. */
  location: AgentSearchLocation;
  onSearchNotFound?: () => void;
  /** The searchId from the route param. */
  searchId: string;
}

export type AutoSubmitHandlerStatus = "loading" | "submitting" | "done";

/**
 * useAutoSubmitTurnHandler — self-contained gate for auto-submission.
 *
 * Owns its own collection subscription. Reads all turns for the searchId,
 * handles queued turn detection and zero-turn recovery, then resolves to
 * "done" so the orchestrator can render the main UI.
 *
 * Flow:
 * 1. "loading" — IDB settling, reading turns
 * 2. "submitting" — queued turn found or zero turns; submitting via API
 * 3. "done" — auto-submit complete (or not applicable); safe to render thread
 *
 * The orchestrator should show a skeleton while status !== "done".
 */
export function useAutoSubmitTurnHandler({
  searchId,
  location,
  initialQuery,
  onSearchNotFound,
}: UseAutoSubmitTurnHandlerOptions): AutoSubmitHandlerStatus {
  const collection = useAgentSearchTurnsCollection();
  const hasSubmittedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevSearchIdRef = useRef(searchId);
  const agentVersion = useSearchConversationalContext()?.agentVersion ?? DEFAULT_AGENT_VERSION;

  // Reset submission guard when searchId changes (new session)
  useEffect(() => {
    if (prevSearchIdRef.current === searchId) {
      return;
    }
    prevSearchIdRef.current = searchId;
    hasSubmittedRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
  }, [searchId]);

  // Guard: non-UUID searchIds skip auto-submit entirely.
  const isMockNotFoundId = searchId ? isMockNotFoundSearchId(searchId) : false;
  const isValidSearchId =
    isMockNotFoundId || (searchId?.length === 36 && UUID_V4_REGEX.test(searchId));

  // ── Read all turns for this searchId (including queued) ────────────────
  const { data: allTurns = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ t: collection })
        .where(({ t }) => eq(t.searchId, searchId))
        .orderBy(({ t }) => t.submittedAt, "asc"),
    [searchId, collection]
  );

  const queuedTurn = allTurns.find((t) => t.status === "queued");
  // Non-queued, non-aborted turns = "real" turns present in the thread
  const realTurnCount = allTurns.filter(
    (t) => t.status !== "queued" && t.status !== "aborted"
  ).length;

  const needsAutoSubmit =
    isValidSearchId && (isMockNotFoundId || !!queuedTurn || realTurnCount === 0);

  // ── Submit effect ──────────────────────────────────────────────────────
  // Intentionally no dependency array — runs every render but ref guard
  // prevents re-execution after first submission. A dep array causes aborts
  // when the optimistic insert triggers re-renders with new turn data.
  useEffect(() => {
    if (isLoading || hasSubmittedRef.current || !needsAutoSubmit) {
      return;
    }

    hasSubmittedRef.current = true;

    const query = queuedTurn?.query ?? initialQuery;

    if (queuedTurn) {
      collection.delete(queuedTurn.id);
    }

    if (isMockNotFoundId) {
      for (const turn of allTurns) {
        if (turn.id !== queuedTurn?.id) {
          collection.delete(turn.id);
        }
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const submission = submitAgentTurn({
      query,
      searchId,
      location,
      signal: controller.signal,
      collection,
      autoSubmitted: true,
      source: "auto",
      agentVersion,
    });

    submission
      .catch((err: unknown) => {
        if (err instanceof SearchNotFoundError) {
          onSearchNotFound?.();
          return;
        }

        devConsole.error("[useAutoSubmitTurnHandler] auto-submit failed:", err);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  });

  // ── Unmount cleanup ────────────────────────────────────────────────────
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  // ── Derive status ──────────────────────────────────────────────────────
  if (isLoading) {
    return "loading";
  }
  // Already submitted or no action needed → done
  if (hasSubmittedRef.current || !needsAutoSubmit) {
    return "done";
  }
  return "submitting";
}
