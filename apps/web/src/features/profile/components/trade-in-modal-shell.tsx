"use client";

import { Button } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import { useState } from "react";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TradeInAddVehicleShell } from "./trade-in-add-vehicle-shell";
import { TradeInModal } from "./trade-in-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeInModalShellProps {
  /** All saved trade-in vehicles (already fetched by TradeInSection) */
  vehicles: TradeInVehicle[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Trade-In Modal Shell — "use client" wrapper that owns modal open state
 * and the add-vehicle overlay state.
 *
 * Renders:
 * - "View all →" button that opens the modal
 * - The TradeInModal controlled by local state
 * - The TradeInAddVehicleShell overlay (controlled, no trigger button)
 *
 * When "Add another trade-in" is clicked inside the modal, the modal closes
 * and the add-vehicle overlay opens.
 */
export function TradeInModalShell({ vehicles }: TradeInModalShellProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);

  function handleAddAnother() {
    setModalOpen(false);
    setAddVehicleOpen(true);
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        size="sm"
        trailingIcon={IconArrowRight}
        variant="text"
      >
        View all
      </Button>

      <TradeInModal
        onAddAnother={handleAddAnother}
        onOpenChange={setModalOpen}
        open={modalOpen}
        vehicles={vehicles}
      />

      <TradeInAddVehicleShell
        externalOpen={addVehicleOpen}
        onOpenChange={setAddVehicleOpen}
        showTrigger={false}
      />
    </>
  );
}
