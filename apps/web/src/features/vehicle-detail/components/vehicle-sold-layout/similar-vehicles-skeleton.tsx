import { CardCarouselSkeleton } from "@shared/components/card";
import { Skeleton } from "@ucmp/ui";

/**
 * Suspense fallback for the SimilarVehicles section on the sold vehicle page.
 *
 * Mirrors the real section's spacing (`col-span-full mt-16 pb-20`), header
 * height, and carousel card dimensions (`lg` size = 362×482 → 448×597) so the
 * page maintains a stable scroll anchor while the async component streams in.
 */
export function SimilarVehiclesSkeleton() {
  return (
    <section
      aria-label="Loading similar vehicles"
      className="col-span-full mt-16 pb-20"
      role="status"
    >
      <Skeleton className="h-6 w-64 rounded-md" />
      <div className="mt-6 -mr-5 lg:-mr-10">
        <CardCarouselSkeleton count={3} size="lg" />
      </div>
    </section>
  );
}
