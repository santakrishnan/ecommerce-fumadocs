"use client";

import type { Collection } from "@tanstack/react-db";
import {
  getVehicleHistoryCollection,
  type VehicleHistoryItem,
} from "../lib/vehicle-history/vehicle-history-collection";
import { useVisitorId } from "./use-visitor-id";

/**
 * Returns the vehicle history TanStack DB collection scoped to the current
 * visitor. Resolves visitorId once so all consumers get the same collection
 * instance without needing to call useVisitorId themselves.
 *
 * Use this hook anywhere you need to query or mutate vehicle history:
 *
 * ```ts
 * const collection = useVehicleHistoryCollection();
 * const { data } = useLiveQuery((q) => q.from({ v: collection })..., []);
 * ```
 */
export function useVehicleHistoryCollection(): Collection<VehicleHistoryItem, string> {
  const visitorId = useVisitorId();
  return getVehicleHistoryCollection(visitorId).collection;
}
