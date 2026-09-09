"use client";

import { ROUTES } from "@config/routes/constants";
import { useEffect, useState } from "react";
import { SEARCH_ENTRY_KEY } from "~/shared/constants/search";

/**
 * Detects if the user is a returning user based on sessionStorage values.
 *
 * Priority (in order):
 * 1. Check DEV_USER_TYPE_FLAG in sessionStorage (set by dev-flags page)
 * 2. Check SEARCH_ENTRY_KEY in sessionStorage (set by search-overlay) - normal production flow
 *
 * Returning users: entry route=/welcome
 * New users: entry route!=/welcome
 *
 * @returns true if the user is a returning user, false otherwise
 */
export function useIsReturningUser(): boolean {
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    try {
      // Check if entry route is /welcome
      const entryRoute = sessionStorage.getItem(SEARCH_ENTRY_KEY);
      const isWelcomeRoute = entryRoute === ROUTES.WELCOME;
      const devFlag = sessionStorage.getItem("DEV_USER_TYPE_FLAG");
      if (devFlag) {
        setIsReturning(devFlag === "returning");
        return;
      }

      // Fall back to normal entry point detection
      setIsReturning(isWelcomeRoute);
    } catch {
      // Graceful degradation: if storage is unavailable (private browsing, etc.)
      setIsReturning(false);
    }
  }, []);

  return isReturning;
}
