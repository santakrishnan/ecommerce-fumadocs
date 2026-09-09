"use client";

import { Button } from "@ucmp/ui";
import { IconArrowRight, IconCalendar, IconCar } from "@ucmp/ui/icons";
import { formatAppointmentDateTime } from "../lib/format-appointment";
import type { TestDriveAppointment } from "../schemas";
import { vehicleLabel } from "./appointment-facts";

interface BookingSummaryProps {
  appointment: TestDriveAppointment;
  mode: "confirmed" | "add-car";
  onAddThisCar: () => void;
  onManage: () => void;
}

function BookingSummary({ appointment, mode, onAddThisCar, onManage }: BookingSummaryProps) {
  const heading =
    mode === "confirmed" ? "Your test drive is confirmed" : "Add to your upcoming test drive visit";

  return (
    <div className="flex flex-col gap-4 pt-8" data-testid="booking-summary">
      <h3 className="subhead-lg text-text-primary">{heading}</h3>

      <div className="flex items-start gap-3">
        <IconCalendar className="size-5 shrink-0 text-text-primary" />
        <span className="body-md text-text-primary">
          {formatAppointmentDateTime(appointment.date, appointment.timeSlot)}
        </span>
      </div>

      {mode === "add-car" && (
        <div className="flex items-start gap-3">
          <IconCar className="size-5 shrink-0 text-text-primary" />
          <span className="body-md text-text-primary">
            {appointment.vehicles.map((vehicle) => vehicleLabel(vehicle)).join(", ")}
          </span>
        </div>
      )}

      {mode === "confirmed" ? (
        <Button
          className="w-fit pl-0"
          onClick={onManage}
          size="sm"
          surface="dark"
          trailingIcon={IconArrowRight}
          variant="text"
        >
          Manage appointment
        </Button>
      ) : (
        <Button
          className="w-fit pl-0"
          onClick={onAddThisCar}
          size="sm"
          surface="dark"
          trailingIcon={IconArrowRight}
          variant="text"
        >
          Add this car
        </Button>
      )}
    </div>
  );
}

export { BookingSummary };
