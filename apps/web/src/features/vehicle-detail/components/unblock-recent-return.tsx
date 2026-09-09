"use client";

import { useEffect } from "react";
import { unblockRecentReturn } from "../actions/unblock-recent-return";

/**
 * Fire-and-forget client component that calls the `unblockRecentReturn`
 * Server Action on mount. Removes the `_ucmp_recent_return_blocked` cookie so
 * the landing page's recent-return experience is no longer blocked once the
 * visitor has browsed a VDP.
 *
 * Renders nothing. Must be placed in the VDP page tree.
 */
export function UnblockRecentReturn() {
  useEffect(() => {
    unblockRecentReturn();
  }, []);

  return null;
}
