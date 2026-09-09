import { Skeleton } from "@ucmp/ui";

/**
 * Appointment section loading skeleton.
 *
 * Matches the visual footprint of the map + card container.
 * Uses rounded-3xl (24px) to match the appointment section's border radius.
 * Used as the Suspense fallback while <AppointmentSection /> loads.
 */
export function AppointmentSkeleton() {
  return (
    <Skeleton className="col-span-full flex h-97 items-center justify-start rounded-3xl px-6">
      <span className="body-xxl text-text-primary">Appointments &amp; Offers</span>
    </Skeleton>
  );
}
