import { MOCK_SEARCH_RESULTS_HEADLINE } from "@features/search/data/mock-search-results";
import { SEARCH_RESULTS_PAGE_SIZE } from "@features/search/data/search-config";
import { PageGrid, Skeleton } from "@ucmp/ui";

/**
 * SearchResultsSkeleton — loading fallback for the results grid page.
 *
 * Mirrors the SearchResultsPage layout exactly to prevent CLS. The static parts
 * of the header (the "See all results" headline) render as real text so they
 * appear instantly in the prerendered shell; only the request-time pieces (the
 * result count, the filter/sort controls, and the cards) are placeholders.
 *
 * Used by `results/page.tsx` as the inline Suspense fallback.
 */
export function SearchResultsSkeleton() {
  return (
    <PageGrid className="mt-16 mb-16 gap-y-8 md:mt-16 md:mb-20 lg:mt-20 lg:mb-20">
      {/* Header — matches SearchResultsHeadline layout */}
      <section className="col-span-full">
        <div className="flex flex-col gap-4 pt-10 md:pt-10 lg:pt-8">
          {/* Count is dynamic — placeholder for the number only */}
          <h4 className="subhead-sm text-text-secondary">
            All <Skeleton className="inline-block h-5 w-8 align-middle" /> results for
          </h4>
          {/* Static headline + placeholder filter/sort controls */}
          <div className="flex w-full flex-col items-start gap-4 lg:flex-row lg:items-end lg:gap-4">
            <h1 className="h1 lg:max-w-xl">{MOCK_SEARCH_RESULTS_HEADLINE.headline}</h1>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Card grid — reserves space so the footer does not jump when results arrive */}
      <section className="col-span-full">
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 md:grid-cols-4 md:gap-y-4 lg:gap-y-3">
          {Array.from({ length: SEARCH_RESULTS_PAGE_SIZE }, (_, i) => {
            const key = `skeleton-card-${i}`;
            return (
              <Skeleton className="aspect-178/237 w-full rounded-lg md:aspect-220/293" key={key} />
            );
          })}
        </div>
      </section>
    </PageGrid>
  );
}
