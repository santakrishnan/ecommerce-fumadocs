import { Carousel, CarouselContent, CarouselItem, Skeleton } from "@ucmp/ui";

const SKELETON_COUNT = 3;
const SKELETON_IDS = Array.from({ length: SKELETON_COUNT }, (_, i) => `search-skeleton-${i}`);

interface PersonalizedSearchSkeletonProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
}

/**
 * 3× skeleton cards used as the Suspense fallback for the Personalized Search
 * section. Uses the same Carousel primitives, colSpan, and responsive
 * aspect-ratio classes as the real PersonalizedSearchCarousel to prevent
 * CLS on reveal.
 */
export function PersonalizedSearchSkeleton({ className }: PersonalizedSearchSkeletonProps = {}) {
  return (
    <section aria-label="Personalized search recommendations loading" className={className}>
      <Carousel>
        <CarouselContent>
          {SKELETON_IDS.map((id) => (
            <CarouselItem colSpan={{ sm: 4, lg: 4 }} key={id}>
              <Skeleton className="aspect-[360/480] w-full rounded-xl lg:aspect-[448/601]" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
