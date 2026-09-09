"use client";

import { devConsole } from "@shared/lib/dev-console";
import { Toggle } from "@ucmp/ui";
import { IconHeart } from "@ucmp/ui/icons";
import { SAVE_SEARCH_STORAGE_KEY_PREFIX, SEARCH_TOGGLE_COPY } from "../../data/save-search-copy";

interface SavedSearchRecord {
  isSaved: boolean;
  savedAt: number;
  sessionId: string;
}

/**
 * Save Search Toggle — toggles heart icon between outline and filled.
 * Persistence: sessionStorage with key "search-saved:{sessionId}" storing SavedSearchRecord.
 * State survives page refresh/reload within the same session.
 * Each new sessionId starts with isSaved = false (default unsaved state).
 *
 * Props:
 *   sessionId: extracted by wrapper from pathname, passed down to ensure consistency
 *   isSaved: controlled prop from wrapper
 *   onToggle: callback to update wrapper state
 */
export function SaveSearchToggle({
  sessionId,
  isSaved,
  onToggle,
}: {
  sessionId: string;
  isSaved: boolean;
  onToggle: (value: boolean) => void;
}) {
  const handleToggle = (value: boolean) => {
    if (!sessionId) {
      return;
    }

    try {
      // Save state with timestamp to sessionStorage
      const storageKey = `${SAVE_SEARCH_STORAGE_KEY_PREFIX}${sessionId}`;
      const record: SavedSearchRecord = {
        sessionId,
        isSaved: value,
        savedAt: Date.now(),
      };
      window.sessionStorage.setItem(storageKey, JSON.stringify(record));
    } catch (error) {
      devConsole.error("Failed to update sessionStorage:", error);
      return;
    }

    // Update parent state
    onToggle(value);
  };

  return (
    <Toggle className="text-text-inverse" onPressedChange={handleToggle} pressed={isSaved}>
      {isSaved ? SEARCH_TOGGLE_COPY.saved : SEARCH_TOGGLE_COPY.unsaved}
      <IconHeart />
    </Toggle>
  );
}
