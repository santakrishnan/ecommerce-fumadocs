"use client";

import { useVisitorIdentity } from "@shared/providers/visitor-provider";
import type { Collection } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import {
  type BookmarkedVehicleItem,
  getBookmarkedVehiclesCollection,
} from "../lib/bookmarked-vehicles-collection";

/**
 * Returns the bookmarked-vehicles TanStack DB collection backed by
 * `@tanstack/query-db-collection`. The server watchlist is the source of truth —
 * the collection auto-fetches on creation and mutations are optimistic.
 *
 * Returns `null` until the real visitor identity is resolved — callers must
 * handle the null case (the query won't fire for an anonymous/unknown visitor).
 *
 * ```ts
 * const collection = useBookmarkedVehiclesCollection();
 * if (!collection) return null; // loading state
 * const isBookmarked = collection.has(vin);
 * ```
 */
export function useBookmarkedVehiclesCollection(): Collection<
  BookmarkedVehicleItem,
  string
> | null {
  const { visitorId } = useVisitorIdentity();
  const queryClient = useQueryClient();

  if (!visitorId) {
    return null;
  }

  return getBookmarkedVehiclesCollection(visitorId, queryClient).collection;
}
