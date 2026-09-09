"use client";

import { ROUTES } from "@config/routes/constants";
import { VDP_REFERRER_KEY } from "@shared/components/shared-hero-transition/config";
import { IconCar } from "@ucmp/ui/icons";
import Image from "next/image";
import Link from "next/link";

import type { ProfileAppointmentVehicle } from "../bff/contracts/profile-appointment-response.schema";

interface AppointmentVehiclesProps {
  vehicles: ProfileAppointmentVehicle[];
}

/**
 * Renders vehicle thumbnail(s) + info in the appointment card.
 *
 * Layout:
 * - Each vehicle is a row: 56px rounded-md thumbnail + gap-6 + text column
 *
 * Multi-vehicle rules:
 * - All vehicles are stacked as rows (each with its own photo thumbnail)
 * - Maximum 5 vehicles displayed; if more than 5, only first 5 are shown
 *
 * On tablet/mobile, ellipsis truncation applies once vehicle info exceeds card width.
 */
export function AppointmentVehicles({ vehicles }: AppointmentVehiclesProps) {
  if (vehicles.length === 0) {
    return null;
  }

  // Limit to first 5 vehicles
  const displayedVehicles = vehicles.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {displayedVehicles.map((vehicle) => (
        <VehicleRow key={vehicle.vin} vehicle={vehicle} />
      ))}
    </div>
  );
}

// ─── Vehicle Row (1-2 vehicles) ──────────────────────────────────────

function VehicleRow({ vehicle }: { vehicle: ProfileAppointmentVehicle }) {
  const vdpHref = ROUTES.vdpSafe({
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    year: vehicle.year,
    vin: vehicle.vin,
  });

  const content = (
    <div className="flex items-center gap-6">
      <VehicleThumbnail imageUrl={vehicle.imageUrl} title={vehicle.title} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pr-4">
        <p className="vehicle-title-sm text-text-primary">{vehicle.title}</p>
        <p className="body-md text-text-primary">
          {vehicle.year} • {vehicle.mileage.toLocaleString()} mi
        </p>
      </div>
    </div>
  );

  if (!vdpHref) {
    return content;
  }

  /**
   * Store the current page path as the VDP referrer so the VDP's floating
   * back button knows to navigate back to Profile instead of Home.
   */
  const handleClick = () => {
    try {
      sessionStorage.setItem(VDP_REFERRER_KEY, window.location.pathname);
    } catch {
      // sessionStorage unavailable — back button will fall back to home
    }
  };

  return (
    <Link
      aria-label={`View details for ${vehicle.title}`}
      className="rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
      href={vdpHref}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}

// ─── Vehicle Thumbnail (photo) ───────────────────────────────────────

function VehicleThumbnail({ imageUrl, title }: { imageUrl?: string; title: string }) {
  if (!imageUrl) {
    return <GenericVehicleIcon />;
  }

  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
      <Image alt={title} className="object-cover" fill sizes="56px" src={imageUrl} />
    </div>
  );
}

// ─── Generic Vehicle Icon (missing image) ───────────────────────────
// Figma: 56px square, bg neutral-500 (#585958), rounded-md, 20px car icon centered

function GenericVehicleIcon() {
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-surface-muted">
      <IconCar className="size-5 text-text-primary" />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
