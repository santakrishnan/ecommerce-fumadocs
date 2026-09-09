"use client";

import { ROUTES } from "@config/routes/constants";
import { useSyncExternalStore } from "react";
import { SEARCH_ENTRY_KEY } from "~/shared/constants/search";

/**
 * Reads the search entry route from sessionStorage to determine where the
 * back button should navigate from search pages.
 *
 * Returns `"/"` or `"/welcome-back"` based on the stored entry context, defaulting
 * to `"/"` when no valid entry is found or during SSR.
 *
 * NOTE: VDP back navigation is handled separately by VdpNavigationBar.
 * This hook is only for search → home/welcome-back navigation.
 */
export function useBackHref(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function unsubscribe(): void {
  // Intentionally empty — sessionStorage changes aren't tracked
}

function subscribe(_onStoreChange: () => void): () => void {
  return unsubscribe;
}

function getSnapshot(): string {
  try {
    const entry = sessionStorage.getItem(SEARCH_ENTRY_KEY);
    if (entry === ROUTES.WELCOME || entry === ROUTES.HOME) {
      return entry;
    }
  } catch {
    /* sessionStorage unavailable */
  }
  return ROUTES.HOME;
}

function getServerSnapshot(): string {
  return ROUTES.HOME;
}
