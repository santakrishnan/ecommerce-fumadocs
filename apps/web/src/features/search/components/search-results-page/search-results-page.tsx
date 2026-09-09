"use client";

import { recordSortExecutedAction } from "@features/profile/activities/actions/record-sort-executed";
import type { FilterChangeEntry } from "@features/profile/activities/client";
import {
  recordFilterAddedAction,
  recordFilterRemovedAction,
  recordSmartFilterRemovedAction,
} from "@features/profile/activities/client";
import type { Vehicle } from "@shared/components/inventory-card";
import { devConsole } from "@shared/lib/dev-console";
import { type SortOrder, sortOrderEnum } from "@ucmp/sdk-search-api";
import { PageGrid } from "@ucmp/ui";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import type { PaginatedData } from "../../bff/services/search-results-service";
import { MOCK_SEARCH_RESULTS_HEADLINE } from "../../data/mock-search-results";
import { useFilterData } from "../../hooks/use-filter-data";
import { useSearchLocation } from "../../hooks/use-search-location";
import { useSearchResultsPagination } from "../../hooks/use-search-results-pagination";
import {
  activeFiltersToFilterEntries,
  activeFiltersToSmartFilters,
  activeFilterToFilterEntry,
  contextFiltersToActiveFilters,
} from "../../lib/filter-converters";
import type { ActiveFilter } from "../../types/filters";
import { SearchResultsGrid, SearchResultsPagination } from "../search-results-grid";
import { SearchResultsHeadlineWrapper } from "../search-results-headline";

// ─── URL param helpers ────────────────────────────────────────────────────────

const DEFAULT_SORT = sortOrderEnum.Recommended;
const VALID_SORT_VALUES = new Set(Object.values(sortOrderEnum));

function parseSortParam(value: string | null): SortOrder {
  if (value && VALID_SORT_VALUES.has(value as SortOrder)) {
    return value as SortOrder;
  }
  return DEFAULT_SORT;
}

function parsePageParam(value: string | null): number {
  if (!value) {
    return 1;
  }
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n <= 0 ? 1 : n;
}

function isSameActiveFilter(a: ActiveFilter, b: ActiveFilter): boolean {
  return a.key === b.key && a.value === b.value;
}

/**
 * Records visitor activity for a filter apply: one `filter.added` per newly
 * added filter and one `filter.removed` (or `smartFilter.removed` for smart
 * filter chips) per removed filter, since the previous apply. BFF calls are
 * fire-and-forget — failures never affect the apply. No-ops without a searchId.
 */
function recordFilterChangeActivity(
  searchId: string | undefined,
  previous: ActiveFilter[],
  next: ActiveFilter[]
): void {
  if (!searchId) {
    return;
  }

  const added = next.filter((n) => !previous.some((p) => isSameActiveFilter(p, n)));
  const removed = previous.filter((p) => !next.some((n) => isSameActiveFilter(n, p)));
  if (added.length === 0 && removed.length === 0) {
    return;
  }

  const nextEntries = activeFiltersToFilterEntries(next);

  for (const filter of added) {
    const entry = activeFilterToFilterEntry(filter);
    if (entry) {
      recordFilterAddedAction({ searchId, filter: entry, filters: nextEntries }).catch(() => {
        // Non-critical.
      });
    }
  }

  // Smart-filter chips can expand to multiple pills. Group removed pills by
  // smartFilterName so each chip emits a single `smartFilter.removed` event
  // carrying the full set of filters it represented, rather than one
  // fragmented event per pill.
  const smartFilterRemovals = new Map<string, FilterChangeEntry[]>();

  for (const filter of removed) {
    const entry = activeFilterToFilterEntry(filter);
    if (!entry) {
      continue;
    }
    if (filter.smartFilterName) {
      const existing = smartFilterRemovals.get(filter.smartFilterName);
      if (existing) {
        existing.push(entry);
      } else {
        smartFilterRemovals.set(filter.smartFilterName, [entry]);
      }
    } else {
      recordFilterRemovedAction({ searchId, filter: entry, filters: nextEntries }).catch(() => {
        // Non-critical.
      });
    }
  }

  for (const [name, filters] of smartFilterRemovals) {
    recordSmartFilterRemovedAction({ searchId, name, filters }).catch(() => {
      // Non-critical.
    });
  }
}

export interface SearchResultsPageProps {
  /** When true, active filters came from the search cookie — skip seeding from GET /filters. */
  cookieHasFilters?: boolean;
  /** Main headline text. */
  headline?: string;
  initialActiveFilters?: ActiveFilter[];
  paginatedData: PaginatedData<Vehicle>;
}

export function SearchResultsPage({
  cookieHasFilters = false,
  headline = MOCK_SEARCH_RESULTS_HEADLINE.headline,
  initialActiveFilters = [],
  paginatedData,
}: SearchResultsPageProps) {
  const resultsTopRef = useRef<HTMLElement | null>(null);
  const params = useParams<{ id?: string }>();
  const searchId = params?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterLocation } = useSearchLocation();
  const { data: filterQueryResult } = useFilterData(filterLocation, searchId);
  // When filters came from the cookie the SSR data is already correct —
  // skip seeding activeFilters from selectedContextFilters so the client
  // does not re-fetch search results with the same filters.
  const hasSeededRef = useRef(cookieHasFilters);

  // Initialize sort and page from URL search params
  const [sortOption, setSortOption] = useState<SortOrder>(() =>
    parseSortParam(searchParams.get("sort"))
  );
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(initialActiveFilters);

  useEffect(() => {
    if (hasSeededRef.current || !filterQueryResult?.selectedContextFilters?.length) {
      return;
    }
    hasSeededRef.current = true;
    setActiveFilters(contextFiltersToActiveFilters(filterQueryResult.selectedContextFilters));
  }, [filterQueryResult?.selectedContextFilters]);

  const {
    errorMessage,
    goToPage,
    isLoading: isPaginationLoading,
    paginatedData: livePaginatedData,
  } = useSearchResultsPagination({
    filters: activeFiltersToSmartFilters(activeFilters),
    initialData: paginatedData,
    initialPage: parsePageParam(searchParams.get("page")),
    initialSort: DEFAULT_SORT,
    searchId: searchId ?? "",
    sort: sortOption,
  });

  // Prev-value refs initialized with the current values so every effect below
  // is a no-op on mount. The browser places new pages at the top by default —
  // no JavaScript guard is needed for that.
  const prevPageRef = useRef(livePaginatedData.currentPage);
  const prevSortRef = useRef(sortOption);

  // Syncs the URL and scrolls to the results top when the user changes page or
  // sort. Comparing against prev-refs means this is always a no-op on initial
  // mount (including optimistic-routing double-mounts) — prev === current.
  useEffect(() => {
    const prevPage = prevPageRef.current;
    const prevSort = prevSortRef.current;
    prevPageRef.current = livePaginatedData.currentPage;
    prevSortRef.current = sortOption;

    const pageChanged = prevPage !== livePaginatedData.currentPage;
    const sortChanged = prevSort !== sortOption;
    if (!(pageChanged || sortChanged)) {
      return;
    }

    // Record the sort change (BFF, fire-and-forget) — must never block URL sync.
    if (sortChanged && searchId) {
      recordSortExecutedAction({
        searchId,
        previousSort: prevSort,
        newSort: sortOption,
      }).catch((error) => {
        // Non-critical.
        devConsole.error("[SearchResultsPage] failed to record sort-executed activity", error);
      });
    }

    const urlParams = new URLSearchParams();
    if (livePaginatedData.currentPage > 1) {
      urlParams.set("page", String(livePaginatedData.currentPage));
    }
    if (sortOption !== DEFAULT_SORT) {
      urlParams.set("sort", sortOption);
    }
    const queryString = urlParams.toString();
    router.replace(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });

    if (pageChanged) {
      resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [livePaginatedData.currentPage, sortOption, router]);

  // Resets to page 1 when sort or filters change. Uses separate prev-refs so
  // it is independent of the effect above. goToPage is intentionally omitted
  // from deps — React Compiler stabilizes closures; Biome's
  // useExhaustiveDependencies is disabled.
  const prevSortForResetRef = useRef(sortOption);
  const prevActiveFiltersRef = useRef(activeFilters);
  useEffect(() => {
    const prevSort = prevSortForResetRef.current;
    const prevFilters = prevActiveFiltersRef.current;
    prevSortForResetRef.current = sortOption;
    prevActiveFiltersRef.current = activeFilters;

    if (prevSort === sortOption && prevFilters === activeFilters) {
      return;
    }
    goToPage(1);
  }, [sortOption, activeFilters]);

  // Applies a filter change from the dialog: records the add/remove activity
  // (BFF, fire-and-forget) then commits the new set. Seeding writes directly to
  // setActiveFilters (not this handler), so seeded filters are never recorded.
  function handleApplyFilters(next: ActiveFilter[]) {
    recordFilterChangeActivity(searchId, activeFilters, next);
    setActiveFilters(next);
  }

  return (
    <PageGrid className="mt-16 mb-16 gap-y-8 md:mt-16 md:mb-20 lg:mt-20 lg:mb-20">
      {/* ─── Header: slides up first (0ms delay, 400ms duration) ───────────── */}
      <section className="col-span-full animate-srp-header-in" ref={resultsTopRef}>
        <SearchResultsHeadlineWrapper
          activeFilters={activeFilters}
          count={livePaginatedData.totalItems}
          headline={headline}
          onApplyFilters={handleApplyFilters}
          onSortChange={setSortOption}
          sortOption={sortOption}
        />
      </section>

      {/* ─── Car Listing Grid: delayed 100ms after header, animates as a block ─ */}
      <section
        aria-busy={isPaginationLoading}
        aria-live="polite"
        className="col-span-full flex animate-srp-grid-in flex-col gap-8"
      >
        <div
          className={cn(
            "transition-opacity duration-200",
            isPaginationLoading && "pointer-events-none opacity-40"
          )}
        >
          <SearchResultsGrid vehicles={livePaginatedData.data} />
        </div>
      </section>

      {errorMessage ? (
        <p
          aria-live="assertive"
          className="body-md col-span-full text-center text-text-danger"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {livePaginatedData.totalPages > 1 && (
        <div className="col-span-full flex animate-srp-pagination-in justify-center">
          <SearchResultsPagination
            isLoading={isPaginationLoading}
            onPageChange={goToPage}
            paginatedData={livePaginatedData}
          />
        </div>
      )}
    </PageGrid>
  );
}
