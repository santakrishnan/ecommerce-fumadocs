"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
} from "@ucmp/ui";

import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { AppointmentModalMapCard } from "./appointment-modal-map-card";

interface AppointmentModalProps {
  appointments: ProfileAppointment[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function AppointmentModal({ appointments, onOpenChange, open }: AppointmentModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="pb-0 lg:min-w-205 lg:max-w-300 lg:pb-0" innerClassName="lg:px-10">
        <DialogTopBar className="pt-6 pb-6" />
        <DialogHeader>
          <DialogTitle className="md:h2">
            Appointments &amp; Offers ({appointments.length})
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="mt-8 pr-1">
          <ul
            aria-label="Appointments and offers list"
            className="flex flex-col gap-4"
            data-slot="appointment-modal-list"
          >
            {appointments.map((appointment) => (
              <li data-slot="appointment-modal-list-item" key={appointment.id}>
                <AppointmentModalMapCard appointment={appointment} />
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
