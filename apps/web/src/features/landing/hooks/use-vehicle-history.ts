"use client";

import { useVehicleHistoryCollection } from "@shared/hooks/use-vehicle-history-collection";
import {
  type VehicleHistoryItem,
  vehicleHistorySchema,
} from "@shared/lib/vehicle-history/vehicle-history-collection";
import { useLiveQuery } from "@tanstack/react-db";

/**
 * Provides access to the client-side vehicle browsing history collection.
 *
 * - `history`: vehicles ordered by most recently viewed first.
 * - `isLoading`: true while the initial IDB read is in progress.
 * - `recordView`: call with any Vehicle-shaped object to add it to history.
 *   Invalid shapes are logged as errors and skipped.
 */
export function useVehicleHistory(): {
  history: VehicleHistoryItem[];
  isLoading: boolean;
  recordView: (vehicle: unknown) => void;
} {
  const collection = useVehicleHistoryCollection();

  const { data: history = [], isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ v: collection })
        .select(({ v }) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          trim: v.trim,
          vin: v.vin,
          price: v.price,
          mileage: v.mileage,
          imageUrl: v.imageUrl,
          showBadge: v.showBadge,
          aiDescription: v.aiDescription,
          href: v.href,
          viewedAt: v.viewedAt,
        }))
        .orderBy(({ v }) => v.viewedAt, "desc"),
    [collection]
  );

  function recordView(vehicle: unknown): void {
    const result = vehicleHistorySchema.safeParse(vehicle);
    if (!result.success) {
      console.error("[useVehicleHistory] invalid vehicle shape:", result.error);
      return;
    }
    const now = Date.now();
    if (collection.has(result.data.id)) {
      collection.update(result.data.id, (draft: VehicleHistoryItem) => {
        Object.assign(draft, result.data);
        draft.viewedAt = now;
      });
    } else {
      collection.insert({ ...result.data, viewedAt: now });
    }
  }

  return { history, isLoading, recordView };
}
