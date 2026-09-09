"use client";

import { useState } from "react";

import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { AppointmentModal } from "./appointment-modal";
import { AppointmentModalTrigger } from "./appointment-modal-trigger";

interface AppointmentModalShellProps {
  appointments: ProfileAppointment[];
}

export function AppointmentModalShell({ appointments }: AppointmentModalShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppointmentModalTrigger onViewAll={() => setOpen(true)} />
      <AppointmentModal appointments={appointments} onOpenChange={setOpen} open={open} />
    </>
  );
}
