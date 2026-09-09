"use client";

import { LoadingState } from "@shared/components/loading-state";
import { Dialog, DialogBody, DialogContent, DialogTopBar } from "@ucmp/ui";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { addTradeInVehicleAction } from "../actions/add-trade-in-vehicle";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TradeInVehicleCard } from "./trade-in-vehicle-card";

const ESTIMATING_TEXT = "Estimating value..";
const RESULT_TITLE = "We found your estimated value";
const ACTION_LABEL = "Add vehicle to profile";
const ADD_ERROR_TEXT = "We couldn't add this vehicle to your profile. Please try again.";

interface TradeInEstimateDialogProps {
  onClose: () => void;
  /** Optional callback fired after a vehicle is successfully added to profile. */
  onComplete?: () => void;
  open: boolean;
  vehicle: TradeInVehicle | null;
}

/**
 * Trade-In Estimate Dialog — full-screen modal that shows a loading spinner
 * while the lookup resolves, then displays the estimated vehicle value with
 * an "Add vehicle to profile" CTA.
 *
 * Only a successful add action (`{ success: true }`) triggers the refresh,
 * close, completion callback, and scroll transition. A rejected action keeps
 * the dialog open with a retryable, accessible error message so the user is
 * never left believing an unsuccessful add succeeded.
 */
export function TradeInEstimateDialog({
  onClose,
  onComplete,
  open,
  vehicle,
}: TradeInEstimateDialogProps) {
  const router = useRouter();
  const estimating = open && !vehicle;
  const [hasAddError, setHasAddError] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setHasAddError(false);
      onClose();
    }
  }

  async function handleTradeInVehicleCard() {
    if (!vehicle) {
      return;
    }

    const result = await addTradeInVehicleAction(vehicle);

    if (!result.success) {
      setHasAddError(true);
      return;
    }

    setHasAddError(false);
    startTransition(() => {
      router.refresh();
      onClose();
      onComplete?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent aria-label={estimating ? ESTIMATING_TEXT : RESULT_TITLE} fullScreen>
        <DialogTopBar showCloseButton={!estimating} />
        <DialogBody className="flex flex-col items-center justify-center">
          {estimating ? (
            <LoadingState label={ESTIMATING_TEXT} />
          ) : (
            vehicle && (
              <div className="flex w-full max-w-3xl flex-col gap-10">
                <h1 className="h1 text-text-primary">{RESULT_TITLE}</h1>
                <TradeInVehicleCard
                  action={{ label: ACTION_LABEL, onAction: handleTradeInVehicleCard }}
                  className="p-8 lg:p-8"
                  showOverflowMenu={false}
                  vehicle={vehicle}
                />
                {hasAddError && (
                  <p
                    aria-live="assertive"
                    className="body-sm text-center text-destructive"
                    role="alert"
                  >
                    {ADD_ERROR_TEXT}
                  </p>
                )}
              </div>
            )
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
