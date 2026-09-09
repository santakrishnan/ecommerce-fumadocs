"use client";

import { ROUTES } from "@config/routes/constants";
import { useVehicleHistory } from "@features/landing/hooks/use-vehicle-history";
import {
  hasRequiredActivityData,
  isVinViewSuppressed,
  useVehicleActivityRecorder,
} from "@features/profile/activities/client";
import { useEffect, useRef } from "react";

export interface RecordVehicleViewProps {
  /** Vehicle data to record in browsing history and as a vehicle.viewed activity. */
  vehicle: {
    imageUrl: string;
    make: string;
    mileage: number;
    model: string;
    price: number;
    trim: string;
    vin: string;
    year: number;
  };
}

/**
 * Invisible client island that fires on VDP mount to:
 * 1. Record the vehicle into the TanStack DB browsing history collection
 *    (feeds the "Continue Shopping" carousel on the welcome page).
 * 2. Record a `visitorActivity.vehicle.viewed` activity event via the BFF,
 *    UNLESS the visitor arrived via a tracked card click — in that case
 *    `vehicle.clicked` already covers the intent and `vehicle.viewed` is
 *    suppressed to avoid double-counting.
 *
 * Suppression is checked via `isVinViewSuppressed`, which reads a timestamped
 * sessionStorage entry written by `LinkInventoryCardClient` before navigation.
 * The check is idempotent within the TTL window — both React Strict Mode
 * effect invocations suppress correctly without ref coordination. Expired
 * entries are cleaned up on read.
 *
 * Both side-effects are gated on `vehicle.vin` — they only re-run when the
 * VIN changes, not on re-renders or refocus.
 */
export function RecordVehicleView({ vehicle }: RecordVehicleViewProps) {
  const { recordView } = useVehicleHistory();
  const { recordViewed } = useVehicleActivityRecorder();

  // Tracks the VIN for which vehicle.viewed has already been sent this mount.
  // Prevents React Strict Mode's double effect invocation from firing the event
  // twice on direct navigation (when there is no suppression marker to gate on).
  const viewedForVin = useRef<string | null>(null);

  useEffect(() => {
    // Guard: VIN and title are required for both history recording and activity
    // tracking. An empty VIN produces a corrupt history entry and fails upstream
    // VIN validation, so bail out early rather than firing meaningless events.
    const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();
    if (!hasRequiredActivityData({ vin: vehicle.vin, title })) {
      return;
    }

    const href = ROUTES.vdpSafe({
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      year: vehicle.year,
      vin: vehicle.vin,
    });

    recordView({
      id: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
      vin: vehicle.vin,
      price: vehicle.price,
      mileage: vehicle.mileage,
      imageUrl: vehicle.imageUrl,
      href: href ?? undefined,
      viewedAt: Date.now(),
    });

    if (!isVinViewSuppressed(vehicle.vin) && viewedForVin.current !== vehicle.vin) {
      viewedForVin.current = vehicle.vin;
      recordViewed(
        {
          vin: vehicle.vin,
          title,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          listPrice: vehicle.price,
          mileage: vehicle.mileage,
        },
        "Vdp"
      );
    }
  }, [vehicle.vin]); // Only re-run if the VIN changes

  return null;
}
