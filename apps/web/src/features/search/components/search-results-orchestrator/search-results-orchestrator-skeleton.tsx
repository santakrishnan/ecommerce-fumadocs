import { PageGrid, Skeleton } from "@ucmp/ui";

/**
 * Full-page skeleton for the SearchResultsOrchestrator.
 *
 * Mirrors the exact two-column PageGrid layout used in ActiveTurnRow:
 * - Left (col-span-4 on lg): eyebrow + response text — same padding/offset
 * - Right (col-span-7 col-start-6 on lg): card grid — same sticky/height
 *
 * Class names are copied verbatim from the orchestrator source to guarantee
 * zero layout shift (CLS < 0.05) when the real component mounts.
 *
 * Used in two places:
 * 1. `dynamic()` loading fallback in `SearchResultsOrchestratorWrapper`
 * 2. Route-level `loading.tsx` for `/search/[id]`
 */
export function SearchResultsOrchestratorSkeleton() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none">
        <PageGrid className="h-full lg:grid-rows-[minmax(0,1fr)]">
          {/* Left column — matches ActiveTurnRow left panel */}
          <div className="col-span-4 -mr-5 flex flex-col md:col-span-8 lg:col-span-4 lg:mr-0 lg:h-full lg:min-h-0">
            <div className="pt-(--search-nav-height,7.5rem) pr-5 pb-32 lg:pt-[calc(var(--search-nav-height,7.5rem)+1.5rem)] lg:pr-0 lg:pb-40">
              <div className="flex flex-col gap-8">
                {/* Eyebrow placeholder */}
                <Skeleton className="h-5 w-2/5" />
                {/* Response body lines */}
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
                {/* Action button placeholder */}
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right column — matches ActiveTurnRow right panel (desktop only) */}
          <div className="hidden lg:sticky lg:top-0 lg:col-span-7 lg:col-start-6 lg:flex lg:h-dvh lg:flex-col lg:pt-(--search-nav-height,7.5rem) lg:pb-10">
            <div className="flex flex-1 items-start gap-4">
              <Skeleton className="aspect-3/5 flex-1 rounded-2xl" />
              <Skeleton className="aspect-3/5 flex-1 rounded-2xl" />
            </div>
          </div>
        </PageGrid>
      </div>
    </div>
  );
}
