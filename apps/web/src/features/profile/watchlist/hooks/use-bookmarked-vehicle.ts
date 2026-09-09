"use client";

import { devConsole } from "@shared/lib/dev-console";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useBookmarkedVehiclesCollection } from "../hooks/use-bookmarked-vehicles-collection";

export interface UseBookmarkedVehicleResult {
  /** Whether the vehicle VIN is currently bookmarked. */
  isBookmarked: boolean;
  /** True while the visitor identity is unresolved or the initial server fetch is in progress. */
  isLoading: boolean;
  /**
   * Toggle: bookmarks (insert) if not bookmarked, unbookmarks (delete) if bookmarked.
   * Optimistic — the UI updates instantly. The server call runs in the background
   * via the collection's onInsert/onDelete handlers.
   * Returns the new bookmarked state.
   */
  toggle: () => boolean;
}

/**
 * Provides reactive bookmarked-state and toggle behavior for a single vehicle.
 *
 * Backed by `@tanstack/query-db-collection` — the server watchlist is the
 * source of truth. `useLiveQuery` provides fine-grained reactivity (only
 * re-renders when THIS vin's membership changes). Mutations are optimistic
 * with automatic server sync via the collection's onInsert/onDelete handlers.
 *
 * Returns `isLoading: true` until the visitor identity resolves and the initial
 * server fetch completes — no network request fires for anonymous visitors.
 *
 * This hook is the single source of truth for bookmark state. Both the VDP
 * purchase card and inventory card save-button should use it.
 */
export function useBookmarkedVehicle(vin: string): UseBookmarkedVehicleResult {
  const collection = useBookmarkedVehiclesCollection();

  const { data = [], isLoading: queryLoading } = useLiveQuery(
    (q) => {
      if (!collection) {
        return;
      }
      return q.from({ v: collection }).where(({ v }) => eq(v.vin, vin));
    },
    [vin, collection]
  );

  const isLoading = !collection || queryLoading;
  const isBookmarked = data.length > 0;

  function toggle(): boolean {
    if (!collection) {
      return false;
    }

    if (vin.length !== 17) {
      devConsole.error("[useBookmarkedVehicle] VIN must be 17 characters:", vin);
      return false;
    }

    if (collection.has(vin)) {
      collection.delete(vin);
      return false;
    }

    collection.insert({ vin, vehicleId: "", title: "", price: 0 });
    return true;
  }

  return { isBookmarked, isLoading, toggle };
}
