"use client";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
} from "@ucmp/ui";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TradeInVehicleCard } from "./trade-in-vehicle-card";

const ADD_ANOTHER_TRADE_IN_LABEL = "Add another trade-in";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeInModalProps {
  /** Callback to trigger the add-vehicle lookup flow */
  onAddAnother: () => void;
  /** Controlled open state */
  onOpenChange: (open: boolean) => void;
  /** Whether the modal is open */
  open: boolean;
  /** List of saved trade-in vehicles to display */
  vehicles: TradeInVehicle[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Trade-In Modal — scrollable list of all saved trade-in vehicles.
 *
 * Opened from TradeInModalShell when visitor has 2+ vehicles.
 * No BFF call — vehicles are passed as props from the server component.
 */
export function TradeInModal({ vehicles, open, onOpenChange, onAddAnother }: TradeInModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-label={`Trade-ins (${vehicles.length})`}
        className="overflow-hidden pb-0 lg:min-w-205 lg:max-w-300 lg:pb-0"
        innerClassName="lg:px-10"
      >
        <DialogTopBar className="pt-6 pb-6" />
        <DialogHeader>
          <DialogTitle className="md:h2">Trade-ins ({vehicles.length})</DialogTitle>
        </DialogHeader>

        {/* Scrollable card list */}
        <DialogBody className="mt-8 flex w-full flex-col gap-2 overflow-x-hidden pb-10">
          {vehicles.map((vehicle) => (
            <div className="shrink-0" key={vehicle.id}>
              <TradeInVehicleCard vehicle={vehicle} />
            </div>
          ))}
          <Button fullWidth onClick={onAddAnother} size="sm" variant="tertiary">
            {ADD_ANOTHER_TRADE_IN_LABEL}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
