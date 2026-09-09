"use client";

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { type Collection, createCollection } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  addToWatchlistClient,
  fetchWatchlistClient,
  removeFromWatchlistClient,
} from "../bff/services/watchlist-client";

/**
 * Zod schema for a bookmarked vehicle record.
 *
 * Stores the 4 fields the BED watchlist service expects:
 * - `vin` — mandatory, 17-char ISO 3779
 * - `vehicleId` — optional, defaults to empty string
 * - `title` — optional, defaults to empty string
 * - `price` — optional, defaults to 0
 *
 * When saving to the server, all 4 fields are sent — if data isn't available
 * locally, the empty/zero defaults are used.
 */
export const bookmarkedVehicleSchema = z.object({
  vin: z.string().length(17),
  vehicleId: z.string().default(""),
  title: z.string().default(""),
  price: z.number().default(0),
});

export type BookmarkedVehicleItem = z.infer<typeof bookmarkedVehicleSchema>;

// ─── Visitor-scoped collection factory ───────────────────────────────────────

type BookmarkedVehiclesCollection = Collection<BookmarkedVehicleItem, string>;

let _current: {
  visitorId: string;
  collection: BookmarkedVehiclesCollection;
} | null = null;

/**
 * Returns the bookmarked-vehicles collection backed by `@tanstack/query-db-collection`.
 *
 * The server (BED watchlist) is the source of truth. On creation the collection
 * fetches the full watchlist via TanStack Query. Mutations (`insert` / `delete`)
 * are optimistic — the UI updates instantly, and `onInsert` / `onDelete` fire
 * the API call in the background.
 *
 * visitorId is required — use useBookmarkedVehiclesCollection() to obtain it
 * via React context rather than calling this directly.
 */
export function getBookmarkedVehiclesCollection(
  visitorId: string,
  queryClient: QueryClient
): {
  visitorId: string;
  collection: BookmarkedVehiclesCollection;
} {
  if (_current?.visitorId !== visitorId) {
    const collection = createCollection(
      queryCollectionOptions({
        queryKey: ["watchlist", visitorId],
        queryClient,
        getKey: (item) => item.vin,
        schema: bookmarkedVehicleSchema,
        staleTime: 5 * 60 * 1000, // 5 min — dedup refetches on re-mount / strict mode

        queryFn: async () => {
          const items = await fetchWatchlistClient();
          return items.map((item) => ({
            vin: item.vin,
            vehicleId: String((item as Record<string, unknown>).vehicleId ?? ""),
            title: String((item as Record<string, unknown>).title ?? ""),
            price: Number((item as Record<string, unknown>).price ?? 0),
          }));
        },

        onInsert: async ({ transaction }) => {
          for (const mutation of transaction.mutations) {
            const { vin, vehicleId, title, price } = mutation.modified;
            await addToWatchlistClient({ vin, vehicleId, title, price });
          }
        },

        onDelete: async ({ transaction }) => {
          for (const mutation of transaction.mutations) {
            await removeFromWatchlistClient(mutation.key);
          }
        },
      })
    ) as unknown as BookmarkedVehiclesCollection;

    _current = { visitorId, collection };
  }
  return _current;
}
