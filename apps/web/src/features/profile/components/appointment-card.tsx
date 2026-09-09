import { Card, Separator } from "@ucmp/ui";
import { IconCalendar, IconLocation } from "@ucmp/ui/icons";
import { cn } from "utils";

import type { ProfileAppointment } from "../bff/contracts/profile-appointment-response.schema";
import { formatScheduledDate } from "./appointment-card-helpers";
import { AppointmentCta } from "./appointment-cta";
import { OfferLockup } from "./appointment-offer-lockup";
import { AppointmentVehicles } from "./appointment-vehicles";

interface AppointmentCardProps {
  appointment: ProfileAppointment;
  /** Allow parent to control sizing/placement without a wrapper. */
  className?: string;
}

/**
 * Appointment detail card — Server Component.
 *
 * Dark overlay card (432px on desktop).
 * Card variants:
 *
 * 1. test_drive: label → vehicle → divider → [px-20 indented: date/location + "Manage" CTA]
 * 2. offer (with appointment): label → vehicle → [pl-20: date/location + "Manage" CTA + divider + offer]
 * 3. offer (no appointment): label → vehicle → [pl-20: offer lockup + divider + dealership + "Book" button]
 *
 * Card: 432px (md:w-108), rounded-xl (16px), bg-card-dark, px-8 (32px) py-10 (40px).
 * Inner content: gap-8 (32px) between major sections.
 */
export function AppointmentCard({ appointment, className }: AppointmentCardProps) {
  const isOffer = appointment.type === "offer";
  const isSold = appointment.type === "vehicle_sold";
  const hasAppointment = !!appointment.scheduledAt;

  return (
    <Card
      className={cn(
        "bg-card-dark px-5 py-6 text-text-primary shadow-none ring-0 md:px-8 md:py-10",
        className
      )}
      data-slot="appointment-card"
      data-surface="dark"
    >
      {isSold ? (
        <VehicleSoldBody appointment={appointment} />
      ) : (
        <div className="flex flex-col gap-8">
          {/* Top section: label + share + vehicle */}
          <div className="flex flex-col gap-4">
            {/* Label + share icon row */}
            <div className="flex items-center justify-between">
              <p className="body-sm text-text-primary">{appointment.label}</p>
              <AppointmentCta type="share" />
            </div>

            {/* Vehicle(s) */}
            <AppointmentVehicles vehicles={appointment.vehicles} />
          </div>

          {/* Card body — depends on type */}
          {isOffer && hasAppointment && <OfferWithAppointmentBody appointment={appointment} />}
          {isOffer && !hasAppointment && <OfferOnlyBody appointment={appointment} />}
          {appointment.type === "test_drive" && <TestDriveBody appointment={appointment} />}
        </div>
      )}
    </Card>
  );
}

// ─── Vehicle Sold Body ────────────────────────────────────────────────
// Completely different layout: heading → message → "Search similar to this" button

function VehicleSoldBody({ appointment }: { appointment: ProfileAppointment }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h3 className="h3 text-text-primary">{appointment.label}</h3>
        {appointment.soldMessage && (
          <p className="body-md text-text-primary">{appointment.soldMessage}</p>
        )}
      </div>
      <AppointmentCta type="search" />
    </div>
  );
}

// ─── Test Drive Body ─────────────────────────────────────────────────
// Structure from Figma: divider → px-[80px] container with metadata + CTA

function TestDriveBody({ appointment }: { appointment: ProfileAppointment }) {
  return (
    <>
      <Separator />
      {/* Figma: px-[80px] — horizontal padding on both sides */}
      <div className="flex flex-col gap-6 md:px-20">
        <AppointmentMetadata appointment={appointment} />
        <AppointmentCta type="manage" />
      </div>
    </>
  );
}

// ─── Offer With Appointment Body ─────────────────────────────────────
// pl-[80px] container with metadata + CTA + divider + offer

function OfferWithAppointmentBody({ appointment }: { appointment: ProfileAppointment }) {
  return (
    <div className="flex flex-col gap-8 md:pl-20">
      {/* Appointment details + manage CTA */}
      <div className="flex flex-col gap-6">
        <AppointmentMetadata appointment={appointment} />
        <AppointmentCta type="manage" />
      </div>

      <Separator />

      {/* Offer lockup — prefixed with "Your offer:" in this variant */}
      <OfferLockup appointment={appointment} showOfferPrefix />
    </div>
  );
}

// ─── Offer Only Body (no appointment) ────────────────────────────────
// pl-[80px] container with offer + divider + dealership + button

function OfferOnlyBody({ appointment }: { appointment: ProfileAppointment }) {
  return (
    <div className="flex flex-col gap-8 md:pl-20">
      {/* Offer lockup */}
      <OfferLockup appointment={appointment} />

      <Separator />

      {/* Dealership + Book button */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {/* Dealership name: 14px semibold, -4% tracking */}
          <div className="pb-1">
            <p className="subhead-sm text-text-primary">{appointment.dealershipName}</p>
          </div>
          {/* Address: 14px regular with map pin icon */}
          <div className="flex items-start gap-2">
            <IconLocation className="size-5 text-text-primary" />
            <p className="body-md text-text-primary">{appointment.dealershipAddress}</p>
          </div>
        </div>
        <AppointmentCta type="book" />
      </div>
    </div>
  );
}

// ─── Appointment Metadata (date + location) ──────────────────────────
// Figma: 12px regular, -2% tracking, 16px leading, icons 20px, gap-[8px] between rows

function AppointmentMetadata({ appointment }: { appointment: ProfileAppointment }) {
  const formattedDate = appointment.scheduledAt
    ? formatScheduledDate(appointment.scheduledAt)
    : null;

  return (
    <div className="flex flex-col gap-2">
      {formattedDate && (
        <div className="flex items-start gap-2">
          <IconCalendar className="size-5 text-text-primary" />
          <p className="body-sm text-text-primary">{formattedDate}</p>
        </div>
      )}
      <div className="flex items-start gap-2">
        <IconLocation className="size-5 text-text-primary" />
        <p className="body-sm text-text-primary">{appointment.dealershipAddress}</p>
      </div>
    </div>
  );
}
