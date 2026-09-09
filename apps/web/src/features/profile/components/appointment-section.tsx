import appointmentMap from "@public/images/profile/appointment-map.png";
import toyotaMapPin from "@public/images/profile/toyota-map-pin.svg";
import Image from "next/image";
import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { getProfileAppointment } from "../bff/use-cases/get-profile-appointment";
import { AppointmentCard } from "./appointment-card";
import { AppointmentModalShell } from "./appointment-modal-shell";

/**
 * Appointment section — Server Component.
 *
 * Visible for T2 (test_drive) and T3 (offer) visitors.
 *
 * Layout:
 * - Outer container: rounded-3xl (24px), p-5 (20px), relative
 * - Map: full background image (absolute, opacity-90, non-interactive)
 * - Toyota pin: absolutely positioned in the left half of the map area
 * - Detail card: positioned on the right side via ml-auto, overlaying the map
 *
 * The card floats over the right portion of the map — it's NOT a side-by-side
 * flex layout. The map fills the full container width behind the card.
 *
 * Returns null if no appointments are available (T1 visitors).
 */
export async function AppointmentSection() {
  const result = await getProfileAppointment();

  if (!result.success || result.data.length === 0) {
    return null;
  }

  // Safe assertion: length check above guarantees at least one element
  const firstAppointment = result.data[0] as ProfileAppointment;
  const appointmentCount = result.data.length;

  return (
    <section
      aria-label="Appointments & Offers"
      className="col-span-full"
      data-slot="appointment-section"
    >
      <div className="flex items-center justify-between pb-4">
        <h2 className="font-bold text-sm text-text-primary uppercase leading-heading tracking-tightest">
          Appointments &amp; Offers ({appointmentCount})
        </h2>
        {(appointmentCount > 1 || firstAppointment.vehicles.length > 1) && (
          <AppointmentModalShell appointments={result.data} />
        )}
      </div>

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

        <div className="relative p-5">
          {/* Map pin — absolutely positioned in the left half on desktop, centered above card on mobile */}
          <div className="flex items-center justify-center py-16 md:absolute md:inset-y-0 md:left-0 md:w-1/2 md:py-0">
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

          {/* Card floats on the right half, overlaying the map */}
          <AppointmentCard appointment={firstAppointment} className="md:ml-auto md:w-1/2" />
        </div>
      </div>
    </section>
  );
}
