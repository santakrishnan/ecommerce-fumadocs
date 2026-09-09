"use client";

import { useVehicleActivityRecorder } from "@features/profile/activities/client";
import { useBookmarkedVehicle } from "@features/profile/watchlist";
import { Toggle } from "@ucmp/ui";
import { IconSaved } from "@ucmp/ui/icons";
import { cn } from "utils";
import type { Vehicle } from "./inventory-card-types";

export interface SaveButtonProps {
  badgePosition: string;
  /** Called whenever the saved state toggles. */
  onSavedChange?: (vehicleId: string, saved: boolean) => void;
  /**
   * Full vehicle object — used to populate the VehicleRef snapshot sent with
   * bookmark/unbookmark activity events. Required for activity recording;
   * the button still functions (without tracking) if omitted.
   */
  vehicle?: Vehicle;
  /**
   * Unique identifier for the vehicle being saved (vin).
   * Used as the IDB key and to derive isBookmarked from the collection.
   */
  vehicleId: string;
  vehicleLabel: string;
}

/**
 * Save Button — Client Component for toggling vehicle bookmark state.
 *
 * Derives `isBookmarked` reactively from the bookmarked-vehicles TanStack DB
 * collection (IDB-backed, visitor-scoped). The filled icon renders when the
 * vehicleId (vin) is present in the collection; unbookmarking removes it.
 *
 * On save: optimistically inserts VIN → fires POST /watchlist → reconciles
 * local state with server's full VIN list on success.
 * On unsave: optimistically removes VIN → fires DELETE /watchlist/{vin}.
 * On failure: optimistic state stays (no rollback, no retry).
 *
 * Also fires `visitorActivity.vehicle.bookmarked` / `vehicle.unbookmarked`
 * via the BFF when the `vehicle` prop is provided and visitor identity has
 * resolved.
 *
 * Both VDP purchase card and inventory cards share this same bookmarked-vehicles
 * collection via useBookmarkedVehicle.
 */
export function SaveButton({
  badgePosition,
  vehicleId,
  vehicleLabel,
  vehicle,
  onSavedChange,
}: SaveButtonProps) {
  const { isBookmarked, toggle } = useBookmarkedVehicle(vehicleId);
  const { recordBookmarked, recordUnbookmarked } = useVehicleActivityRecorder();

  const handlePressedChange = () => {
    const nowBookmarked = toggle();

    if (vehicle?.vin) {
      const title =
        `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`.trim();
      const vehicleRef = {
        vin: vehicle.vin,
        title,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        listPrice: vehicle.price,
        mileage: vehicle.mileage,
      };

      if (nowBookmarked) {
        recordBookmarked(vehicleRef);
      } else {
        recordUnbookmarked({ vin: vehicle.vin, title });
      }
    }

    onSavedChange?.(vehicleId, nowBookmarked);
  };

  return (
    <Toggle
      aria-label={
        isBookmarked ? `Remove ${vehicleLabel} from saved vehicles` : `Save ${vehicleLabel}`
      }
      className={cn(
        "absolute z-20 shadow-md transition-opacity duration-200",
        // Tablet/mobile: always visible. Desktop: hover-revealed, unless saved.
        "opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 lg:focus-visible:opacity-100",
        // Saved state: always visible — the filled icon is the confirmation signal
        isBookmarked && "lg:opacity-100",
        badgePosition
      )}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onPressedChange={handlePressedChange}
      pressed={isBookmarked}
      type="button"
      variant="icon"
    >
      <IconSaved />
    </Toggle>
  );
}
