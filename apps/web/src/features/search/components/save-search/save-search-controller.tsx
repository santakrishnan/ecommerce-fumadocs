"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";
import { devConsole } from "@shared/lib/dev-console";
import { cn } from "@ucmp/ui/lib/utils";
import { useEffect, useState } from "react";
import { SAVE_SEARCH_STORAGE_KEY_PREFIX } from "../../data/save-search-copy";
import { SaveSearchToggle } from "./save-search-toggle";

interface SavedSearchRecord {
  isSaved: boolean;
  savedAt: number;
  sessionId: string;
}

interface SaveSearchControllerProps {
  sessionId?: string;
}

/**
 * SaveSearchController — manages save search state and persistence.
 *
 * Receives sessionId as a prop (extracted by parent from pathname).
 * This keeps pathname/routing logic in one place and avoids SSR issues.
 */
export function SaveSearchController({ sessionId = "" }: SaveSearchControllerProps) {
  const ctx = useSearchConversationalContext();
  const showSaveSearchToggle = ctx?.showSaveSearchToggle ?? false;
  const [isSaved, setIsSaved] = useState(false);

  // Load persisted state from sessionStorage when sessionId changes
  useEffect(() => {
    try {
      if (sessionId) {
        const storageKey = `${SAVE_SEARCH_STORAGE_KEY_PREFIX}${sessionId}`;
        const saved = window.sessionStorage.getItem(storageKey);
        if (saved) {
          try {
            const record: SavedSearchRecord = JSON.parse(saved);
            setIsSaved(record.isSaved);
          } catch (parseError) {
            devConsole.error("Failed to parse saved record:", parseError);
            setIsSaved(false);
          }
        } else {
          // New sessionId: no existing record, start with unsaved state
          setIsSaved(false);
        }
      } else {
        setIsSaved(false);
      }
    } catch (error) {
      devConsole.error("Failed to load state:", error);
      setIsSaved(false);
    }
  }, [sessionId]);

  const handleToggle = (value: boolean) => {
    setIsSaved(value);
  };

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        !showSaveSearchToggle && "invisible opacity-0"
      )}
    >
      <SaveSearchToggle isSaved={isSaved} onToggle={handleToggle} sessionId={sessionId} />
    </div>
  );
}
