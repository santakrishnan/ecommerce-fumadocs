import { CardCarouselSkeleton } from "@shared/components/card";
import { SectionHeader } from "@shared/components/section-header";

/**
 * Skeleton fallback for the Featured Vehicles section (small cards).
 * Placeholders come from the shared `CARD_SIZE.sm` token, so they match
 * `InventoryCard size="small"` exactly and can't drift.
 */
export function FeaturedVehiclesSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading featured vehicles"
      className="w-full"
      role="status"
    >
      <div className="">
        <SectionHeader
          subtitle="Here are the latest listings I've found in the last 24 hours"
          title="NEW TODAY"
        />
        <CardCarouselSkeleton className="mt-4" count={6} size="sm" />
      </div>
    </section>
  );
}
