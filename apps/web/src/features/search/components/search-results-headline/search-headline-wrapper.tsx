import { MOCK_ACTIVE_FILTER_PILLS } from "@features/search/__fixtures__/filter-options.fixture";
import type { SortOrder } from "@ucmp/sdk-search-api";
import type { ActiveFilter } from "../../types/filters";
import { SearchFilterSortBy } from "../search-filters";
import { SearchFilterDialog } from "./search-filter-dialog";
import { SearchResultsHeadline, type SearchResultsHeadlineProps } from "./search-headline";

export type { SearchResultsHeadlineProps } from "./search-headline";

interface SearchResultsHeadlineWrapperProps extends SearchResultsHeadlineProps {
  activeFilters?: ActiveFilter[];
  onApplyFilters?: (filters: ActiveFilter[]) => void;
  onSortChange?: (option: SortOrder) => void;
  sortOption?: SortOrder;
}

export function SearchResultsHeadlineWrapper({
  activeFilters = [...MOCK_ACTIVE_FILTER_PILLS],
  count,
  headline,
  onApplyFilters,
  onSortChange,
  sortOption,
}: SearchResultsHeadlineWrapperProps) {
  return (
    <SearchResultsHeadline count={count} headline={headline}>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        <SearchFilterDialog
          activeFilters={activeFilters}
          key={`filters-${activeFilters.length}`}
          onApplyFilters={onApplyFilters}
        />
        <SearchFilterSortBy onSortChange={onSortChange} value={sortOption} />
      </div>
    </SearchResultsHeadline>
  );
}
