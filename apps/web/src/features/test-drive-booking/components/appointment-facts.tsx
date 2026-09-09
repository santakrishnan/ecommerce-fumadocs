import { IconCalendar, IconCar, IconLocation } from "@ucmp/ui/icons";
import { formatAppointmentDateTime } from "../lib/format-appointment";
import type { TestDriveAppointment } from "../schemas";

interface AppointmentFactsProps {
  appointment: Pick<TestDriveAppointment, "dealerAddress" | "date" | "timeSlot" | "vehicles">;
}

function vehicleLabel(vehicle: TestDriveAppointment["vehicles"][number]): string {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function AppointmentFacts({ appointment }: AppointmentFactsProps) {
  return (
    <ul className="flex flex-col gap-3">
      <li className="flex items-start gap-3">
        <IconLocation className="size-5 shrink-0 text-text-primary" />
        <span className="body-md text-text-primary">{appointment.dealerAddress}</span>
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
  );
}

export { AppointmentFacts, vehicleLabel };
