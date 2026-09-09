"use client";

import { useFuseSearch } from "@ucmp/shared";
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Pill,
  PillGroup,
} from "@ucmp/ui";
import { IconAdd, IconClose, IconSearch } from "@ucmp/ui/icons";
import { cn } from "utils";

import { SEARCH_SUGGESTION_TRIGGERS } from "../../data/suggestion-triggers";
import type { SelectedFilter } from "./filter-content-panel";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SuggestionPill {
  label: string;
  value: string;
}

export interface FilterSearchInputProps {
  /** Currently active filters — used to mark suggestions as selected. */
  activeFilters: SelectedFilter[];
  /** Hide the suggestion pills. Used for the bottom-pinned input on mobile. */
  hideResults?: boolean;
  /** Additional className for the input wrapper — use for responsive visibility. */
  inputClassName?: string;
  /** Called when a suggestion pill is toggled on or off. */
  onFilterSelectionChange: (filter: SelectedFilter, isSelected: boolean) => void;
  /** Called when the query text changes (controlled mode). */
  onQueryChange?: (query: string) => void;
  /** Controlled query value. */
  query?: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

/** Flat corpus of every suggestion across all keyword triggers. */
const ALL_SUGGESTIONS: SuggestionPill[] = SEARCH_SUGGESTION_TRIGGERS.flatMap((t) =>
  t.suggestions.map((s) => ({ label: s.label, value: s.value }))
);

const MAX_SUGGESTIONS = 6;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FilterSearchInput
 *
 * Renders a rounded search input that shows matching suggestion pills below
 * as the user types. Selecting a pill adds it to the active filters (the top
 * filter strip); selecting again removes it.
 *
 * Query state is controlled from the parent to keep both instances in sync.
 */
export function FilterSearchInput({
  activeFilters,
  hideResults = false,
  inputClassName,
  onFilterSelectionChange,
  onQueryChange,
  query = "",
}: FilterSearchInputProps) {
  const { results: suggestions } = useFuseSearch(ALL_SUGGESTIONS, {
    keys: ["label"],
    limit: MAX_SUGGESTIONS,
    controlledQuery: query,
  });

  function handleChange(value: string) {
    onQueryChange?.(value);
  }

  function clearQuery() {
    onQueryChange?.("");
  }

  function isSuggestionSelected(suggestion: SuggestionPill): boolean {
    return activeFilters.some((f) => f.key === "search" && f.value === suggestion.value);
  }

  function handlePillToggle(suggestion: SuggestionPill) {
    const selected = isSuggestionSelected(suggestion);
    onFilterSelectionChange(
      { key: "search", label: suggestion.label, value: suggestion.value },
      !selected
    );
  }

  const hasQuery = query.length > 0;
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Search input ──────────────────────────────────────────────────── */}
      <div className={cn(inputClassName)}>
        <InputGroup
          className={cn(
            "h-auto min-h-14 rounded-full border-0 bg-surface-primary shadow-none",
            "has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          )}
        >
          <InputGroupInput
            aria-label="Search filters"
            className="py-4 pl-8 text-sm placeholder:text-text-tertiary"
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search"
            type="text"
            value={query}
          />
          <InputGroupAddon align="inline-end" className="pr-6">
            {hasQuery ? (
              <Button aria-label="Clear search" onClick={clearQuery} size="icon-sm" variant="text">
                <IconClose className="size-5" />
              </Button>
            ) : (
              <InputGroupText>
                <IconSearch aria-hidden className="size-5 text-text-secondary" />
              </InputGroupText>
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* ── Suggestion pills ─────────────────────────────────────────────── */}
      {!hideResults && hasSuggestions && (
        <PillGroup aria-label="Search suggestions" className="min-h-54 flex-col items-start gap-2">
          {suggestions.map((suggestion) => {
            const selected = isSuggestionSelected(suggestion);
            return (
              <Pill
                hideClose
                key={suggestion.value}
                onPressedChange={() => handlePillToggle(suggestion)}
                pressed={selected}
                value={suggestion.value}
              >
                {suggestion.label}
                {selected ? (
                  <IconClose className="size-3" data-icon="inline-end" />
                ) : (
                  <IconAdd className="size-3" data-icon="inline-end" />
                )}
              </Pill>
            );
          })}
        </PillGroup>
      )}
    </div>
  );
}
