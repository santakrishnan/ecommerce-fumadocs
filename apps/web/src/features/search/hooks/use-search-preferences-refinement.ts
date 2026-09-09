"use client";

import type { SearchPreferencesPopoverProps } from "@features/landing/components/search-prompt";
import { useRef, useState } from "react";
import { useSearchConversationalContext } from "../context/search-conversational-context";
import type { AgentSearchTurn, NextSearchPlan } from "../lib/agent-search-turns-collection";
import { contextFiltersToActiveFilters } from "../lib/filter-converters";
import type { SubmitTurnOptions } from "./use-agent-search-turns";
import { useSearchLocation } from "./use-search-location";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchFilter = NextSearchPlan["filters"][number];

interface UseSearchPreferencesRefinementParams {
  /** True when a turn is already pending or streaming — blocks new submissions. */
  isStreaming: boolean;
  /** The last query from the most recent turn — used as the base for the refinement. */
  lastTurnQuery: string | undefined;
  /** Submit a new turn to the agent. */
  submitTurn: (options: SubmitTurnOptions) => void;
  /** All visible turns — used to derive preferences from the last completed turn. */
  turns: AgentSearchTurn[];
}

export interface UseSearchPreferencesRefinementReturn {
  /** Whether any preferences have been dismissed (used for save button enabled state). */
  hasUnsavedChanges: boolean;
  /** Called by the orchestrator to tag a newly-added turn as refinement-triggered. */
  markRefinementTurn: () => void;
  /** Resets all refinement state — call when a new user search is submitted. */
  resetRefinement: () => void;
  /** Ready-to-spread props for `<SearchPreferencesPopover>`. */
  searchPreferences: SearchPreferencesPopoverProps;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPLANATION_TEXT =
  "These preferences reflect the filters active in your current search. Dismiss any to refine your results.";

/**
 * Extracts `nextSearchPlan.filters` from the last completed turn's response.
 * Returns the response-level filters (even if empty — an explicit empty array
 * means "no filters active"). Falls back to the first card's nextSearchPlan
 * only when the response itself is absent (turn still resolving).
 */
function getLastCompletedFilters(turns: AgentSearchTurn[]): SearchFilter[] {
  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i];
    if (turn?.status !== "complete" || !turn.response) {
      continue;
    }

    return turn.response.nextSearchPlan?.filters ?? [];
  }
  return [];
}

/**
 * Converts nextSearchPlan filters into human-readable preference labels.
 * Reuses contextFiltersToActiveFilters which handles enum, multi-enum, and range
 * filters identically (the shapes are structurally compatible).
 */
function filtersToPreferenceLabels(filters: SearchFilter[]): string[] {
  const activeFilters = contextFiltersToActiveFilters(
    filters as Parameters<typeof contextFiltersToActiveFilters>[0]
  );
  return activeFilters.map((f) => f.label);
}

/**
 * Builds a notification string describing which preferences were removed.
 */
function buildRemovalNotification(removedLabels: string[]): string {
  if (removedLabels.length === 1) {
    return `Removed preference: ${removedLabels[0]}`;
  }
  return `Removed preferences: ${removedLabels.join(", ")}`;
}

/**
 * Removes dismissed labels from a multi-enum filter's values array.
 * Only drops the filter entirely when no values remain.
 * For non-multi-enum filters (range, single value), drops the whole filter.
 */
function buildRemainingFilters(
  sourceFilters: SearchFilter[],
  dismissedLabels: string[]
): SearchFilter[] {
  const remaining: SearchFilter[] = [];

  for (const filter of sourceFilters) {
    // Multi-enum: remove individual values that were dismissed
    if (filter.values && filter.values.length > 0) {
      const keptValues = filter.values.filter((value) => !dismissedLabels.includes(String(value)));
      if (keptValues.length > 0) {
        remaining.push({ ...filter, values: keptValues });
      }
      continue;
    }

    // Single value or range: check if the derived label was dismissed
    const labels = filtersToPreferenceLabels([filter]);
    if (labels.every((label) => !dismissedLabels.includes(label))) {
      remaining.push(filter);
    }
  }

  return remaining;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the preference-removal refinement flow on the search results page.
 *
 * Derives preferences from the last completed turn's `nextSearchPlan.filters`.
 * When a user dismisses a preference, the corresponding filter is removed and
 * a new turn is submitted with the reduced filter set.
 */
export function useSearchPreferencesRefinement({
  isStreaming,
  lastTurnQuery,
  submitTurn,
  turns,
}: UseSearchPreferencesRefinementParams): UseSearchPreferencesRefinementReturn {
  const searchCtx = useSearchConversationalContext();
  const { location } = useSearchLocation();

  // Derive the source filters from the last completed turn
  const sourceFilters = getLastCompletedFilters(turns);
  const sourceLabels = filtersToPreferenceLabels(sourceFilters);

  // Track dismissed labels. Keyed to the source labels string so it auto-resets
  // when the underlying filters change (new turn completes with different filters).
  const sourceKey = sourceLabels.join("|");
  const [dismissedState, setDismissedState] = useState<{
    dismissed: string[];
    key: string;
  }>({ dismissed: [], key: sourceKey });

  // Auto-reset dismissed state when source filters change
  const dismissedLabels = dismissedState.key === sourceKey ? dismissedState.dismissed : [];

  // The base query before any refinement annotations were appended.
  const baseQueryRef = useRef<string | undefined>(undefined);

  // Track the next turn ID that will be a refinement turn.
  const pendingRefinementRef = useRef(false);

  // Compute current draft preferences (source minus dismissed)
  const draftPreferences = sourceLabels.filter((label) => !dismissedLabels.includes(label));

  const handleDismissPreference = (preferenceToRemove: string) => {
    setDismissedState((prev) => ({
      dismissed:
        prev.key === sourceKey ? [...prev.dismissed, preferenceToRemove] : [preferenceToRemove],
      key: sourceKey,
    }));
  };

  const handleSaveChanges = () => {
    if (dismissedLabels.length === 0) {
      return;
    }

    // Don't submit if a turn is already in flight — revert dismissals.
    if (isStreaming) {
      setDismissedState({ dismissed: [], key: sourceKey });
      return;
    }

    // Build the reduced filter set (multi-enum values removed individually)
    const remainingFilters = buildRemainingFilters(sourceFilters, dismissedLabels);

    // Capture the base query on the first refinement
    if (baseQueryRef.current === undefined) {
      baseQueryRef.current = lastTurnQuery;
    }

    const notificationText = buildRemovalNotification(dismissedLabels);

    const refinementQuery = baseQueryRef.current
      ? `${baseQueryRef.current} (${notificationText})`
      : notificationText;

    pendingRefinementRef.current = true;

    if (searchCtx) {
      searchCtx.setSearchConversationalState("refinement");
    }

    submitTurn({
      filters: remainingFilters,
      location,
      query: refinementQuery,
      refinementNotification: notificationText,
      // A preference refinement always opens a new standalone row — never folds
      // into the current row as a follow-up.
      source: "filters",
    });

    // Clear dismissed state — next render will pick up the new turn's filters
    setDismissedState({ dismissed: [], key: sourceKey });
  };

  const handlePreferencePanelClose = () => {
    // Revert any unsaved dismissed preferences
    setDismissedState({ dismissed: [], key: sourceKey });
  };

  const markRefinementTurn = () => {
    if (!pendingRefinementRef.current) {
      return;
    }
    pendingRefinementRef.current = false;
  };

  const resetRefinement = () => {
    setDismissedState({ dismissed: [], key: sourceKey });
    pendingRefinementRef.current = false;
    baseQueryRef.current = undefined;
  };

  return {
    hasUnsavedChanges: dismissedLabels.length > 0,
    markRefinementTurn,
    resetRefinement,
    searchPreferences: {
      explanationText: EXPLANATION_TEXT,
      hasUnsavedChanges: dismissedLabels.length > 0,
      onClose: handlePreferencePanelClose,
      onDismissPreference: handleDismissPreference,
      onSave: handleSaveChanges,
      preferences: draftPreferences,
    },
  };
}
