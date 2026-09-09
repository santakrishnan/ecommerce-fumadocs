import { Skeleton } from "@ucmp/ui";

interface DealerDealSkeletonProps {
  /** Outer wrapper class (e.g. col-span-full). */
  className?: string;
}

/**
 * Skeleton placeholder for the DealerDealCard.
 *
 * Mirrors the real card's responsive image and financing-panel structure.
 * Placeholder dimensions remain approximate until the deal data is available.
 */
export function DealerDealSkeleton({ className }: DealerDealSkeletonProps = {}) {
  return (
    <section
      aria-busy="true"
      aria-label="Loading featured dealer deal"
      className={className}
      role="status"
    >
      <div className="hidden lg:block">
        <Skeleton className="h-5 w-64 rounded" />
      </div>

      <div className="mt-4">
        <div className="relative -mx-5 flex w-[calc(100%+2.5rem)] flex-col overflow-clip rounded-none lg:mx-auto lg:w-full lg:rounded-2xl">
          <Skeleton className="aspect-[4/3.5] w-full md:aspect-video lg:aspect-[5/2] xl:aspect-[16/5]" />
          <div className="mx-5 mb-5 flex w-auto flex-col gap-10 rounded-xl bg-muted/30 p-6 lg:absolute lg:top-5 lg:right-5 lg:bottom-5 lg:mx-0 lg:mb-0 lg:w-1/3 lg:justify-between lg:rounded-2xl lg:p-8 xl:w-1/3">
            <div className="flex flex-col gap-10">
              <Skeleton className="h-12 w-3/4 rounded" />
              <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-20 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-20 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-10 w-12 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            </div>
            <Skeleton className="mt-10 h-11 w-full rounded-full lg:mt-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
