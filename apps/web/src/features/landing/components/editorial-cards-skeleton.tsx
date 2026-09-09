import { Skeleton } from "@ucmp/ui";

const SKELETON_COUNT = 4;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => `editorial-skeleton-${i}`);

interface EditorialCardsSkeletonProps {
  className?: string;
}

/**
 * 4× skeleton cards (334×445 px at desktop) used as the Suspense fallback for
 * the Editorial Cards section. Matches the section's padding and carousel
 * layout to prevent CLS on reveal.
 */
export function EditorialCardsSkeleton({ className }: EditorialCardsSkeletonProps = {}) {
  return (
    <section aria-label="Curated collections loading" className={className}>
      <div>
        {/* Card placeholders — match medium editorial card dimensions */}
        <div className="flex gap-2 overflow-hidden">
          {SKELETON_IDS.map((id) => (
            <Skeleton
              className="aspect-[268/357] w-[268px] shrink-0 rounded-xl lg:aspect-[334/445] lg:w-[334px]"
              key={id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
