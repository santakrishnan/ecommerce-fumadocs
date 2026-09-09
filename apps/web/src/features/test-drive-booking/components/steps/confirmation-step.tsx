"use client";

import { Button } from "@ucmp/ui";
import { IconCheckCircle } from "@ucmp/ui/icons";
import type { TestDriveAppointment } from "../../schemas";
import { AppointmentFacts } from "../appointment-facts";

interface ConfirmationStepProps {
  addedModel?: string;
  appointment: TestDriveAppointment;
  onAddToCalendar: () => void;
  onManage: () => void;
  variant: "confirmed" | "added";
}

function ConfirmationStep({
  appointment,
  onAddToCalendar,
  onManage,
  variant,
  addedModel,
}: ConfirmationStepProps) {
  const heading =
    variant === "added"
      ? `This ${addedModel ?? "car"} is added to your test drive appointment at ${appointment.dealerName}.`
      : `Your test drive is confirmed at ${appointment.dealerName}.`;

  return (
    <div className="flex flex-col gap-6">
      <IconCheckCircle aria-hidden="true" className="size-12 text-green-500" />

      <div className="flex flex-col gap-3">
        <h2 className="h3 text-text-primary">{heading}</h2>
        <p className="body-md text-text-secondary">
          Please bring a valid driver&apos;s license for your test drive. If you decide to buy,
          you&apos;ll also need financial or banking information and trade-in details.
        </p>
      </div>

      <AppointmentFacts appointment={appointment} />

      <div className="flex flex-col items-center gap-4">
        {/* TODO: wire calendar export (ICS / Google) — intentionally no action for the mock. */}
        <Button
          className="h-14 w-full"
          fullWidth
          onClick={onAddToCalendar}
          size="lg"
          variant="primary"
        >
          Add to calendar
        </Button>
        <p className="body-sm text-text-secondary">
          Need to make changes?{" "}
          <button className="underline hover:opacity-80" onClick={onManage} type="button">
            Cancel or modify
          </button>
        </p>
      </div>
    </div>
  );
}

export { ConfirmationStep };
