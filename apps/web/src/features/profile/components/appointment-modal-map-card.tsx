import appointmentMap from "@public/images/profile/appointment-map.png";
import toyotaMapPin from "@public/images/profile/toyota-map-pin.svg";
import Image from "next/image";
import { cn } from "utils";
import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { AppointmentCard } from "./appointment-card";

interface AppointmentModalMapCardProps {
  appointment: ProfileAppointment;
}

export function AppointmentModalMapCard({ appointment }: AppointmentModalMapCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <Image
        alt="Map showing dealership location"
        className="pointer-events-none object-cover opacity-90"
        fill
        placeholder="blur"
        priority={false}
        sizes="(max-width: 768px) 100vw, 800px"
        src={appointmentMap}
      />

      <div
        className={cn(
          "relative min-h-96 p-5",
          "grid gap-5 md:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] md:items-stretch"
        )}
      >
        <div className="flex min-h-72 items-center justify-center self-stretch rounded-2xl">
          <div className="relative size-20 drop-shadow-[0px_4px_10px_rgba(0,0,0,0.25)]">
            <Image
              alt="Dealership location pin"
              className="object-contain"
              fill
              sizes="80px"
              src={toyotaMapPin}
            />
          </div>
        </div>

        <div className="w-full min-w-0">
          <AppointmentCard appointment={appointment} />
        </div>
      </div>
    </div>
  );
}
