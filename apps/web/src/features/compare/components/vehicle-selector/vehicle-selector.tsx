"use client";

import { ROUTES } from "@config/routes/constants";
import { recordVehicleActivityAction } from "@features/profile/activities/actions/record-vehicle-activity";
import { setClickedReferrer } from "@features/profile/activities/client";
import type { Vehicle } from "@shared/components/inventory-card";
import { toVehicleCardProps, VehicleCard } from "@shared/components/vehicle-card";
import { IconCaretDown, IconCaretUp, IconCheckmark } from "@ucmp/ui/icons";
import { useRef } from "react";
import { cn } from "utils";
import { CompareCardMorph } from "./compare-card-morph";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VehicleSelectorProps {
  /** Additional class names for the outer container */
  className?: string;
  /** Whether the card should display in compact morphed layout. */
  isCompact?: boolean;
  /** Called before navigating to a VDP — allows parent to persist state. */
  onBeforeVdpNavigate?: () => void;
  /** Called when the dropdown open state changes (for parent to render dropdown) */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state — parent manages which selector is open */
  open?: boolean;
  /** Mark first image as LCP priority */
  priority?: boolean;
  /** ID of the currently selected vehicle */
  selectedVehicleId: string;
  /** List of vehicles available for comparison */
  vehicles: Vehicle[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * VehicleSelector — a dropdown card used in each column of the comparison table.
 *
 * Collapsed: displays the selected vehicle via CompareVehicleCard (full variant)
 * with a dropdown chevron.
 *
 * Expanded: the parent renders the dropdown list outside the carousel via
 * VehicleSelectorList to avoid overflow clipping.
 */
export function VehicleSelector({
  className,
  isCompact = false,
  onBeforeVdpNavigate,
  onOpenChange,
  open = false,
  priority,
  selectedVehicleId,
  vehicles,
}: VehicleSelectorProps) {
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];

  if (!selectedVehicle) {
    return null;
  }

  const vdpHref =
    selectedVehicle.href ??
    ROUTES.vdpSafe({
      make: selectedVehicle.make,
      model: selectedVehicle.model,
      trim: selectedVehicle.trim,
      year: selectedVehicle.year,
      vin: selectedVehicle.vin ?? selectedVehicle.id,
    });

  const handleBeforeNavigate = () => {
    const vin = selectedVehicle.vin ?? selectedVehicle.id;
    const title =
      `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.trim ? ` ${selectedVehicle.trim}` : ""}`.trim();

    setClickedReferrer(vin);

    recordVehicleActivityAction({
      type: "visitorActivity.vehicle.clicked",
      vehicle: {
        vin,
        title,
        year: selectedVehicle.year,
        make: selectedVehicle.make,
        model: selectedVehicle.model,
        trim: selectedVehicle.trim,
        listPrice: selectedVehicle.price,
        mileage: selectedVehicle.mileage,
      },
      source: "Comparison",
    }).catch(() => {
      // fire-and-forget
    });
    onBeforeVdpNavigate?.();
  };

  return (
    <div className={cn("w-full", className)}>
      <CompareCardMorph
        href={vdpHref}
        isCompact={isCompact}
        onBeforeNavigate={handleBeforeNavigate}
        priority={priority}
        toggle={
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label="Select vehicle for comparison"
            className="cursor-pointer p-1"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange?.(!open);
            }}
            type="button"
          >
            {open ? (
              <IconCaretUp className="size-4 shrink-0 text-text-primary" />
            ) : (
              <IconCaretDown className="size-4 shrink-0 text-text-primary" />
            )}
          </button>
        }
        vehicle={selectedVehicle}
      />
    </div>
  );
}

// ─── Shared Dropdown List ─────────────────────────────────────────────────────

export interface VehicleSelectorListProps {
  className?: string;
  /** Called when the user requests dismissal (e.g. Escape key). */
  onDismiss?: () => void;
  onSelect: (vehicleId: string) => void;
  selectedVehicleId: string;
  vehicles: Vehicle[];
}

/**
 * VehicleSelectorList — the scrollable vehicle list used in the dropdown.
 * Rendered outside the carousel by the parent to avoid overflow clipping.
 *
 * Implements the WAI-ARIA listbox keyboard pattern:
 * - ArrowDown / ArrowUp: move focus between options
 * - Home / End: jump to first / last option
 * - Enter / Space: select the focused option
 */
export function VehicleSelectorList({
  className,
  onDismiss,
  onSelect,
  selectedVehicleId,
  vehicles,
}: VehicleSelectorListProps) {
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const handleListKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = currentIndex < vehicles.length - 1 ? currentIndex + 1 : 0;
        focusOption(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : vehicles.length - 1;
        focusOption(prev);
        break;
      }
      case "Home": {
        e.preventDefault();
        focusOption(0);
        break;
      }
      case "End": {
        e.preventDefault();
        focusOption(vehicles.length - 1);
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        onSelect(vehicles[currentIndex]?.id ?? "");
        break;
      }
      case "Escape": {
        e.preventDefault();
        onDismiss?.();
        break;
      }
      default:
        break;
    }
  };

  // The selected option (or first if none match) gets tabIndex 0; others get -1.
  const activeIndex = Math.max(
    vehicles.findIndex((v) => v.id === selectedVehicleId),
    0
  );

  return (
    <div
      aria-label="Available vehicles"
      className={cn(
        "mt-2 max-h-88 overflow-y-auto rounded-xl bg-surface-primary [&::-webkit-scrollbar]:hidden",
        className
      )}
      role="listbox"
    >
      {vehicles.map((vehicle, index) => {
        const isSelected = vehicle.id === selectedVehicleId;
        return (
          <div
            aria-selected={isSelected}
            className={cn(
              "cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl",
              isSelected ? "bg-neutral-100" : "hover:bg-neutral-100"
            )}
            key={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            onKeyDown={(e) => handleListKeyDown(e, index)}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            role="option"
            tabIndex={index === activeIndex ? 0 : -1}
          >
            <div className="relative">
              <VehicleCard
                {...toVehicleCardProps(vehicle)}
                className="rounded-none bg-transparent"
                isSelected={isSelected}
              />
              {/* Selected overlay on thumbnail */}
              {isSelected && (
                <div
                  className="absolute top-4 left-4 size-19 overflow-hidden rounded-lg"
                  data-slot="vehicle-card-image-overlay"
                >
                  <div className="flex size-full items-center justify-center bg-black/40">
                    <div className="flex size-6 items-center justify-center rounded-full bg-surface-primary">
                      <IconCheckmark className="size-5 text-text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
