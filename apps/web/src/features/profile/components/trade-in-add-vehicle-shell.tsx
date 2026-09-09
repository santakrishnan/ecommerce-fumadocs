"use client";

import { Button, Dialog, DialogBody, DialogContent, DialogTopBar, DialogTrigger } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import { useState } from "react";
import { TradeInInvitationCard } from "./trade-in-invitation-card";

const ADD_VEHICLE_LABEL = "Add a vehicle";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradeInAddVehicleShellProps {
  /** Whether this shell is controlled externally (e.g. from TradeInModalShell). */
  externalOpen?: boolean;
  /** Callback fired whenever the overlay open state changes (for externally controlled usage). */
  onOpenChange?: (open: boolean) => void;
  /** Whether to render the trigger button. Set false when controlled externally. */
  showTrigger?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Trade-In Add Vehicle Shell — client island for the "Add a vehicle" CTA + overlay.
 *
 * Renders a full-screen overlay (matching TradeInEstimateDialog's sizing) containing
 * the TradeInInvitationCard. When the user successfully adds a vehicle, the overlay
 * closes and the page refreshes (handled by TradeInEstimateDialog internally).
 *
 * Usage:
 * - 1-vehicle path: renders its own "Add a vehicle →" trigger button
 * - 2+-vehicle path: controlled externally by TradeInModalShell (no trigger button)
 */
export function TradeInAddVehicleShell({
  externalOpen,
  onOpenChange,
  showTrigger = externalOpen === undefined,
}: TradeInAddVehicleShellProps) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;

  function handleOpenChange(nextOpen: boolean) {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button size="sm" trailingIcon={IconArrowRight} variant="text">
              {ADD_VEHICLE_LABEL}
            </Button>
          }
        />
      )}

      <DialogContent aria-label="Add a trade-in vehicle" fullScreen>
        <DialogTopBar />
        <DialogBody className="flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl">
            <TradeInInvitationCard onComplete={() => handleOpenChange(false)} />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
