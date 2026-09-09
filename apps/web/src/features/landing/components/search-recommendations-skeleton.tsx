import { Skeleton } from "@ucmp/ui";

const SKELETON_IDS = [
  "search-rec-skeleton-0",
  "search-rec-skeleton-1",
  "search-rec-skeleton-2",
  "search-rec-skeleton-3",
  "search-rec-skeleton-4",
  "search-rec-skeleton-5",
] as const;

interface SearchRecommendationsSkeletonProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
}

/**
 * Suspense fallback for the Search Recommendations section.
 * Matches the small inventory card dimensions to prevent CLS.
 */
export function SearchRecommendationsSkeleton({
  className,
}: SearchRecommendationsSkeletonProps = {}) {
  return (
    <div className={className}>
      <section aria-label="Search recommendations loading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-full max-w-64" />
          <Skeleton className="h-3 w-full max-w-96" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {SKELETON_IDS.map((id) => (
            <Skeleton
              className="h-[14.8125rem] w-[11.125rem] shrink-0 rounded-xl lg:h-[18.3125rem] lg:w-[13.75rem]"
              key={id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
