"use client";

import { useVehicleHistory } from "@features/landing/hooks/use-vehicle-history";
import type { Vehicle } from "@shared/components/inventory-card";
import { ContinueShoppingCarousel } from "./continue-shopping-carousel";

export interface ContinueShoppingConnectedProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
  /** Server-fetched "New Today" listings. */
  newToday: Vehicle[];
  /** Pin group headings while the track scrolls horizontally. */
  stickyHeader?: boolean;
}

/**
 * Binds the combined carousel to the **TanStack DB** recently-viewed store
 * (`useVehicleHistory` → `useLiveQuery` over the IndexedDB collection) and
 * passes the server-fetched New Today through. Loaded with `ssr: false` (see
 * `continue-shopping-client`) because the live query has no server snapshot.
 *
 * Returns `null` when both data sources are empty (after loading completes)
 * so that no wrapper element remains in the DOM.
 */
export function ContinueShoppingConnected({
  className,
  newToday,
  stickyHeader,
}: ContinueShoppingConnectedProps) {
  const { history, isLoading } = useVehicleHistory();

  // Deduplicate: remove any New Today vehicles already in Recently Viewed.
  // Recently Viewed takes priority — VIN (or id fallback) is the unique key.
  const viewedKeys = new Set(history.map((v) => v.vin ?? v.id));
  const dedupedNewToday = newToday.filter((v) => !viewedKeys.has(v.vin ?? v.id));

  // Both sources empty and done loading — hide section entirely.
  if (!isLoading && history.length === 0 && dedupedNewToday.length === 0) {
    return null;
  }

  // IDB still loading and no server data — render nothing to avoid skeleton flash.
  if (isLoading && newToday.length === 0) {
    return null;
  }

  return (
    <ContinueShoppingCarousel
      className={className}
      isLoading={isLoading}
      newToday={dedupedNewToday}
      recentlyViewed={history}
      stickyHeader={stickyHeader}
    />
  );
}
