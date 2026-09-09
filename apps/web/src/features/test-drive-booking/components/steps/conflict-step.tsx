"use client";

import { Button, Separator } from "@ucmp/ui";
import { IconCalendar, IconCar, IconLocation } from "@ucmp/ui/icons";
import { formatAppointmentDateTime } from "../../lib/format-appointment";
import type { TestDriveAppointment } from "../../schemas";
import { vehicleLabel } from "../appointment-facts";

interface ConflictAppointment {
  date: string;
  dealerName: string;
  timeSlot: string;
  vehicles: TestDriveAppointment["vehicles"];
}

interface ConflictStepProps {
  existing: ConflictAppointment;
  isSubmitting: boolean;
  next: ConflictAppointment;
  onPrimary: () => void;
  onSecondary: () => void;
  variant: "replace" | "same-day";
}

function ConflictBlock({
  heading,
  appointment,
}: {
  heading: string;
  appointment: ConflictAppointment;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="subhead-sm text-text-secondary uppercase">{heading}</p>
      <ul className="flex flex-col gap-2">
        <li className="flex items-start gap-3">
          <IconLocation className="size-5 shrink-0 text-text-primary" />
          <span className="body-md text-text-primary">{appointment.dealerName}</span>
        </li>
        <li className="flex items-start gap-3">
          <IconCalendar className="size-5 shrink-0 text-text-primary" />
          <span className="body-md text-text-primary">
            {formatAppointmentDateTime(appointment.date, appointment.timeSlot)}
          </span>
        </li>
        {appointment.vehicles.map((vehicle) => (
          <li className="flex items-start gap-3" key={vehicle.vin}>
            <IconCar className="size-5 shrink-0 text-text-primary" />
            <span className="body-md text-text-primary">{vehicleLabel(vehicle)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConflictStep({
  existing,
  isSubmitting,
  next,
  onPrimary,
  onSecondary,
  variant,
}: ConflictStepProps) {
  const heading =
    variant === "replace"
      ? "You already have an appointment at the same time. Would you like to replace it?"
      : "You already have a test drive on this day. Would you like to continue?";
  const primaryLabel = variant === "replace" ? "Replace appointment" : "Continue anyway";

  return (
    <div className="flex flex-col gap-6">
      <h2 className="h3 text-text-primary">{heading}</h2>

      <div className="flex flex-col gap-4 rounded-2xl bg-surface-primary p-5">
        <ConflictBlock appointment={existing} heading="Existing" />
        <Separator />
        <ConflictBlock appointment={next} heading="New" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="h-14 w-full"
          disabled={isSubmitting}
          fullWidth
          onClick={onPrimary}
          size="lg"
          variant="primary"
        >
          {primaryLabel}
        </Button>
        <Button
          className="h-14 w-full"
          disabled={isSubmitting}
          fullWidth
          onClick={onSecondary}
          size="lg"
          variant="secondary"
        >
          Keep existing
        </Button>
      </div>
    </div>
  );
}

export { ConflictStep };
