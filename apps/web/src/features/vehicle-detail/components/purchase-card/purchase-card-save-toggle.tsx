"use client";

import { useVehicleActivityRecorder } from "@features/profile/activities/client";
import { useBookmarkedVehicle } from "@features/profile/watchlist";
import { Toggle } from "@ucmp/ui";
import { IconSaved } from "@ucmp/ui/icons";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import type { PurchaseCardVehicle } from "./purchase-card.types";

interface PurchaseCardSaveToggleProps {
  isSaved?: boolean;
  onSaveToggle?: () => void;
  vehicle: PurchaseCardVehicle;
}

/**
 * Client island for PurchaseCard bookmark behavior.
 *
 * - Uncontrolled mode: derives state from TanStack DB via useBookmarkedVehicle
 *   and fires `visitorActivity.vehicle.bookmarked` / `vehicle.unbookmarked`
 *   activity events via the BFF on each toggle.
 * - Controlled mode: uses `isSaved` + `onSaveToggle` passed from parent.
 *   Activity events are NOT fired — the controlled caller owns that logic.
 * - SSR-safe: `useBookmarkedVehicle` uses `useSyncExternalStore` with
 *   `getServerSnapshot`, so the toggle can render without mount-time gating.
 */
export function PurchaseCardSaveToggle({
  isSaved,
  onSaveToggle,
  vehicle,
}: PurchaseCardSaveToggleProps) {
  const isControlled = typeof isSaved === "boolean";

  const { isBookmarked: bookmarkedFromCollection, toggle } = useBookmarkedVehicle(vehicle.vin);
  const { recordBookmarked, recordUnbookmarked } = useVehicleActivityRecorder();
  const [optimisticPressed, setOptimisticPressed] = useState(bookmarkedFromCollection);

  useEffect(() => {
    setOptimisticPressed(bookmarkedFromCollection);
  }, [bookmarkedFromCollection]);

  let pressed: boolean;
  if (isControlled) {
    pressed = Boolean(isSaved);
  } else {
    pressed = optimisticPressed;
  }

  const handlePressedChange = useCallback(() => {
    if (isControlled) {
      onSaveToggle?.();
      return;
    }

    // Immediately toggle the local state for instant UI feedback
    setOptimisticPressed((prev) => !prev);

    // Update the collection (optimistic mutation will sync back via useEffect)
    toggle();
    onSaveToggle?.();

    // Fire activity event — the new state is the opposite of the current pressed value
    const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();
    const willBeBookmarked = !pressed;
    if (willBeBookmarked) {
      recordBookmarked(
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
    } else {
      recordUnbookmarked({ vin: vehicle.vin, title });
    }
  }, [isControlled, onSaveToggle, toggle, pressed, vehicle, recordBookmarked, recordUnbookmarked]);

  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Toggle
      aria-label={pressed ? "Remove from saved vehicles" : "Save vehicle"}
      className="size-6 bg-transparent p-0 text-text-primary shadow-none hover:bg-transparent hover:shadow-none aria-pressed:bg-transparent lg:size-6"
      onClick={handleClick}
      onPressedChange={handlePressedChange}
      pressed={pressed}
      type="button"
      variant="icon"
    >
      <IconSaved className="size-6" />
    </Toggle>
  );
}
