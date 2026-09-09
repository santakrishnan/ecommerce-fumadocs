"use client";

import { VerificationStep } from "@shared/components/verification-step";
import { Dialog, DialogContent, DialogTitle } from "@ucmp/ui";
import type { UseTestDriveBookingResult } from "../hooks/use-test-drive-booking";
import { ConfirmationStep } from "./steps/confirmation-step";
import { ConflictStep } from "./steps/conflict-step";
import { IdentityStep } from "./steps/identity-step";

interface BookTestDriveModalProps {
  booking: UseTestDriveBookingResult;
}

function BookTestDriveModal({ booking }: BookTestDriveModalProps) {
  const {
    appointment,
    close,
    contactDisplay,
    currentVehicle,
    dealerName,
    isSubmitting,
    onKeepExisting,
    onProceedSameDay,
    onReplace,
    onSubmitIdentity,
    onVerify,
    selectedDate,
    selectedSlot,
    step,
  } = booking;

  const nextSummary = {
    dealerName,
    date: selectedDate,
    timeSlot: selectedSlot ?? "",
    vehicles: [currentVehicle],
  };

  return (
    <Dialog onOpenChange={(open) => (open ? undefined : close())} open={booking.isOpen}>
      <DialogContent className="lg:max-w-[34rem]">
        <DialogTitle className="sr-only">Book a test drive</DialogTitle>

        {step === "identity" && <IdentityStep onContinue={onSubmitIdentity} />}

        {step === "verification" && (
          <VerificationStep
            contactDisplay={contactDisplay}
            isSubmitting={isSubmitting}
            onVerify={onVerify}
          />
        )}

        {step === "same-day-reminder" && appointment && (
          <ConflictStep
            existing={appointment}
            isSubmitting={isSubmitting}
            next={nextSummary}
            onPrimary={onProceedSameDay}
            onSecondary={onKeepExisting}
            variant="same-day"
          />
        )}

        {step === "replace-conflict" && appointment && (
          <ConflictStep
            existing={appointment}
            isSubmitting={isSubmitting}
            next={nextSummary}
            onPrimary={onReplace}
            onSecondary={onKeepExisting}
            variant="replace"
          />
        )}

        {step === "confirmation" && appointment && (
          <ConfirmationStep
            appointment={appointment}
            onAddToCalendar={close}
            onManage={close}
            variant="confirmed"
          />
        )}

        {step === "added" && appointment && (
          <ConfirmationStep
            addedModel={currentVehicle.model}
            appointment={appointment}
            onAddToCalendar={close}
            onManage={close}
            variant="added"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export { BookTestDriveModal };
