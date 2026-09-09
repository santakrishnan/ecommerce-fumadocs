import { PageGrid, Skeleton } from "@ucmp/ui";

export function TurnSkeleton() {
  return (
    <PageGrid className="pt-(--search-nav-height,7.5rem)">
      <div className="col-span-full lg:col-span-4">
        <div className="flex flex-col gap-8 py-6 lg:pt-6">
          {/* Eyebrow */}
          <Skeleton className="h-5 w-2/5" />
          {/* Response body lines */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    </PageGrid>
  );
}
