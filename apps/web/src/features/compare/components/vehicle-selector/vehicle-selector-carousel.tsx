"use client";

import type { Vehicle } from "@shared/components/inventory-card";
import { Carousel, CarouselContent, CarouselItem } from "@ucmp/ui";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import { VehicleSelector, VehicleSelectorList } from "./vehicle-selector";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VehicleSelectorCarouselProps {
  /** All vehicles available in the dropdown for switching. */
  availableVehicles: Vehicle[];
  /** Whether cards should render in compact (morphed) layout. */
  isCompact?: boolean;
  /** Called before navigating to a VDP — allows parent to persist state. */
  onBeforeVdpNavigate?: () => void;
  /** Called when the user switches a vehicle in a column. Args: (columnIndex, vehicleId). */
  onSelectionChange?: (columnIndex: number, vehicleId: string) => void;
  /** Currently selected vehicle IDs — one per column. Determines column count. */
  selectedVehicleIds: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * VehicleSelectorCarousel — renders one VehicleSelector per column in a
 * responsive carousel. Desktop shows 3 columns; mobile shows 2 with
 * horizontal scroll.
 *
 * On md+ the dropdown renders inside the carousel item so it inherits the
 * card width naturally. On mobile it renders full-width below the carousel.
 *
 * Column count is driven by `selectedVehicleIds.length` (configurable by parent).
 */
export function VehicleSelectorCarousel({
  availableVehicles,
  isCompact = false,
  onBeforeVdpNavigate,
  onSelectionChange,
  selectedVehicleIds,
}: VehicleSelectorCarouselProps) {
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking anywhere outside this component
  useEffect(() => {
    if (openColumn === null) {
      return;
    }

    function handleMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenColumn(null);
      }
    }

    // Use setTimeout to avoid catching the same click that opened the dropdown
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [openColumn]);

  const handleSelect = (columnIndex: number) => (vehicleId: string) => {
    onSelectionChange?.(columnIndex, vehicleId);
    setOpenColumn(null);
  };

  const handleOpenChange = (columnIndex: number) => (isOpen: boolean) => {
    setOpenColumn(isOpen ? columnIndex : null);
  };

  const dismiss = () => setOpenColumn(null);

  return (
    <div
      className={cn(
        "relative",
        // When dropdown is open on md+, override carousel viewport overflow to
        // visible so the absolutely-positioned dropdown is not clipped.
        // (CSS requires both axes to be visible if one is visible.)
        openColumn !== null &&
          "md:[&_[data-slot=carousel-content]>div]:overflow-x-clip md:[&_[data-slot=carousel-content]>div]:overflow-y-visible"
      )}
      ref={containerRef}
    >
      <Carousel>
        <CarouselContent>
          {selectedVehicleIds.map((selectedId, colIndex) => (
            <CarouselItem
              className={isCompact ? undefined : "animate-compare-card-enter"}
              colSpan={{ sm: 2, md: 4, lg: 3 }}
              key={`col-${String(colIndex)}`}
              style={
                isCompact
                  ? undefined
                  : ({
                      "--compare-card-delay": `${String(colIndex * 100)}ms`,
                      "--compare-card-offset": `${String(colIndex * 4)}rem`,
                    } as React.CSSProperties)
              }
            >
              <div className="relative">
                <VehicleSelector
                  isCompact={isCompact}
                  onBeforeVdpNavigate={onBeforeVdpNavigate}
                  onOpenChange={handleOpenChange(colIndex)}
                  open={openColumn === colIndex}
                  priority={!isCompact && colIndex === 0}
                  selectedVehicleId={selectedId}
                  vehicles={availableVehicles}
                />

                {/* md+ dropdown: rendered inside carousel item, inherits card width */}
                {openColumn === colIndex && (
                  <div className="absolute right-0 left-0 z-20 hidden md:block">
                    <VehicleSelectorList
                      onDismiss={dismiss}
                      onSelect={handleSelect(colIndex)}
                      selectedVehicleId={selectedVehicleIds[colIndex] ?? ""}
                      vehicles={availableVehicles}
                    />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Mobile dropdown: full-width, absolutely positioned below carousel */}
      {openColumn !== null && (
        <div className="absolute right-0 left-0 z-20 md:hidden">
          <VehicleSelectorList
            onDismiss={dismiss}
            onSelect={handleSelect(openColumn)}
            selectedVehicleId={selectedVehicleIds[openColumn] ?? ""}
            vehicles={availableVehicles}
          />
        </div>
      )}
    </div>
  );
}
