"use client";

import { idbCollectionOptions } from "@shared/lib/client-only";
import { type Collection, createCollection } from "@tanstack/react-db";
import { z } from "zod";

/**
 * Zod schema for the Vehicle shape stored in browsing history.
 *
 * Mirrors the `Vehicle` interface from `@shared/components/inventory-card`:
 * a VehicleCard subset (id, make, model, year, trim, price, mileage, imageUrl)
 * plus the UI display fields (showBadge, aiDescription, href).
 *
 * Does not include imageAlt or detailPageUrl — these are not available on
 * all Vehicle instances in the POC and are not needed to render InventoryCard.
 */
export const vehicleHistorySchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(120),
  year: z.number().int().min(1900).max(2100),
  trim: z.string().max(80).optional(),
  vin: z.string().length(17).optional(),
  price: z.number().min(0).max(999_999_999),
  mileage: z.number().int().min(0).max(999_999_999),
  imageUrl: z.string().min(1),
  showBadge: z.boolean().optional(),
  aiDescription: z.string().optional(),
  href: z.string().optional(),
  /** UTC ms timestamp of when the vehicle was last viewed. Used for ordering. */
  viewedAt: z
    .number()
    .int()
    .positive()
    .default(() => Date.now()),
});

export type VehicleHistoryItem = z.infer<typeof vehicleHistorySchema>;

// ─── Visitor-scoped collection factory ───────────────────────────────────────

type VehicleHistoryCollection = Collection<VehicleHistoryItem, string>;

let _current: {
  visitorId: string;
  collection: VehicleHistoryCollection;
  clearStore: () => Promise<void>;
} | null = null;

/**
 * Returns the vehicle history collection scoped to the given visitorId.
 * Creates a new collection instance only when visitorId changes.
 * All consumers in the same render tree share the same instance.
 *
 * visitorId is required — use useVehicleHistoryCollection() to obtain it
 * via React context rather than calling this directly.
 */
export function getVehicleHistoryCollection(visitorId: string): {
  visitorId: string;
  collection: VehicleHistoryCollection;
  clearStore: () => Promise<void>;
} {
  if (_current?.visitorId !== visitorId) {
    // Safe to reassign without explicit disposal: the IDB connection is
    // store-scoped (dbCache in idb-collection-options.ts), not visitor-scoped,
    // so no IDBDatabase handle is leaked. The old Collection instance is
    // released here and becomes eligible for GC once React drops its ref.
    // visitorId is stable for the lifetime of a session in practice, so this
    // branch is only exercised in tests.
    const { config, clearStore } = idbCollectionOptions({
      id: `vehicle-history.${visitorId}`,
      storeName: "vehicle-history",
      schema: vehicleHistorySchema,
      getKey: (v) => v.id,
      getPartitionKey: () => visitorId,
      ttl: 86_400_000, // 24 hours
      capacity: 30,
    });
    _current = {
      visitorId,
      collection: createCollection(config) as unknown as VehicleHistoryCollection,
      clearStore,
    };
  }
  return _current;
}
