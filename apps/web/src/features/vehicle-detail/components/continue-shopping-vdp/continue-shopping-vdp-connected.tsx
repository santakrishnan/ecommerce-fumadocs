"use client";

import { useVehicleHistory } from "@features/landing/hooks/use-vehicle-history";
import type { Vehicle } from "@shared/components/inventory-card";
import { ContinueShoppingVdpCarousel } from "./continue-shopping-vdp-carousel";

export interface ContinueShoppingVdpConnectedProps {
  /** Outer wrapper class. */
  className?: string;
  /** VIN of the currently viewed vehicle — excluded from the carousel. */
  excludeVin: string;
}

/**
 * Binds the VDP continue-shopping carousel to the TanStack DB recently-viewed
 * store. Filters out the current vehicle by VIN so users don't see the page
 * they're already on in the carousel.
 *
 * Loaded with `ssr: false` (via the client wrapper) because the live query
 * has no server snapshot.
 *
 * Returns `null` when:
 * - Loading is done and there are no other vehicles in history.
 */
export function ContinueShoppingVdpConnected({
  className,
  excludeVin,
}: ContinueShoppingVdpConnectedProps) {
  const { history, isLoading } = useVehicleHistory();

  // Filter out the currently viewed vehicle
  const filtered: Vehicle[] = history.filter((v) => (v.vin ?? v.id) !== excludeVin);

  if (!isLoading && filtered.length === 0) {
    return null;
  }

  return (
    <ContinueShoppingVdpCarousel
      className={className}
      isLoading={isLoading}
      recentlyViewed={filtered}
    />
  );
}
