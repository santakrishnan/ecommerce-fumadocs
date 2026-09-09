/// <reference types="@testing-library/jest-dom" />

import type { Vehicle } from "@shared/components/inventory-card";
import { type SortOrder, sortOrderEnum } from "@ucmp/sdk-search-api";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activeFiltersToFilterEntries,
  activeFiltersToSmartFilters,
  activeFilterToFilterEntry,
} from "~/features/search/lib/filter-converters";
import {
  manyPagesMidData,
  singlePageData,
  sixPageData,
} from "../__fixtures__/search-results.fixture";
import type { PaginatedData } from "../bff/services/search-results-service";
import { SearchResultsPage } from "../components/search-results-page/search-results-page";
import { MOCK_SEARCH_RESULTS_HEADLINE } from "../data/mock-search-results";
import type {
  UseSearchResultsPaginationInput,
  UseSearchResultsPaginationReturn,
} from "../hooks/use-search-results-pagination";

const mockGoToPage = vi.fn<(pageNumber: number) => Promise<void>>();
const mockUseSearchResultsPagination =
  vi.fn<(input: UseSearchResultsPaginationInput) => UseSearchResultsPaginationReturn>();

vi.mock("../hooks/use-search-results-pagination", () => ({
  useSearchResultsPagination: (input: UseSearchResultsPaginationInput) =>
    mockUseSearchResultsPagination(input),
}));

const mockRecordSortExecutedAction = vi.fn((_input: unknown) => Promise.resolve());
vi.mock("@features/profile/activities/actions/record-sort-executed", () => ({
  recordSortExecutedAction: (input: unknown) => mockRecordSortExecutedAction(input),
}));

const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useParams: () => ({ id: "test-search-id" }),
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("../components/search-filters", () => ({
  SearchFilterSortBy: ({
    onSortChange,
    value,
  }: {
    onSortChange?: (option: SortOrder) => void;
    value?: SortOrder;
  }) => (
    <div>
      <span data-testid="sort-value">{value ?? "none"}</span>
      <button onClick={() => onSortChange?.(sortOrderEnum.LowestPrice)} type="button">
        Trigger sort change
      </button>
    </div>
  ),
}));

vi.mock("../hooks/use-filter-data", () => ({
  useFilterData: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

vi.mock("../components/search-results-headline/search-filter-dialog", () => ({
  SearchFilterDialog: ({
    activeFilters,
    onApplyFilters,
  }: {
    activeFilters: Array<{ key: string; label: string; value: string }>;
    onApplyFilters?: (filters: Array<{ key: string; label: string; value: string }>) => void;
  }) => (
    <div data-testid="mock-filter-dialog">
      <span data-testid="active-filter-count">{activeFilters.length}</span>
      <button
        onClick={() =>
          onApplyFilters?.([{ key: "model", label: "Highlander 1", value: "Highlander 1" }])
        }
        type="button"
      >
        Apply model filter
      </button>
      <button onClick={() => onApplyFilters?.([])} type="button">
        Clear filters
      </button>
    </div>
  ),
}));

// Isolate shell tests from the router dependency inside SearchResultsPagination.
vi.mock("../components/search-results-grid", () => ({
  SearchResultsGrid: ({ vehicles }: { vehicles: Array<{ id?: string }> }) => (
    <section aria-label="Search results">
      {vehicles.length} cards first:{vehicles[0]?.id ?? "none"}
    </section>
  ),
  SearchResultsPagination: () => <div data-testid="mock-pagination" />,
}));

// Activity server actions are fire-and-forget; the component calls `.catch()` on
// each, so the mocks must return resolved promises.
const mockRecordFilterAddedAction = vi.fn();
const mockRecordFilterRemovedAction = vi.fn();
const mockRecordSmartFilterRemovedAction = vi.fn();

vi.mock("@features/profile/activities/client", () => ({
  recordFilterAddedAction: (input: unknown) => {
    mockRecordFilterAddedAction(input);
    return Promise.resolve();
  },
  recordFilterRemovedAction: (input: unknown) => {
    mockRecordFilterRemovedAction(input);
    return Promise.resolve();
  },
  recordSmartFilterRemovedAction: (input: unknown) => {
    mockRecordSmartFilterRemovedAction(input);
    return Promise.resolve();
  },
}));

describe("SearchResultsPage", () => {
  function buildHookState(
    paginatedData: PaginatedData<Vehicle>,
    overrides: Partial<UseSearchResultsPaginationReturn> = {}
  ): UseSearchResultsPaginationReturn {
    return {
      errorMessage: null,
      goToPage: mockGoToPage,
      isLoading: false,
      paginatedData,
      ...overrides,
    };
  }

  beforeEach(() => {
    mockGoToPage.mockClear();
    mockReplace.mockClear();
    mockUseSearchResultsPagination.mockClear();
    mockRecordSortExecutedAction.mockClear();
    mockRecordFilterAddedAction.mockClear();
    mockRecordFilterRemovedAction.mockClear();
    mockRecordSmartFilterRemovedAction.mockClear();
    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState(initialData)
    );
    mockSearchParams.delete("sort");
    mockSearchParams.delete("page");
  });

  it("renders the total item count from paginatedData", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);
    expect(screen.getByText(`All ${singlePageData.totalItems} results for`)).toBeInTheDocument();
  });

  it("renders the default headline when no headline prop is provided", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      MOCK_SEARCH_RESULTS_HEADLINE.headline
    );
  });

  it("renders a custom headline when provided", () => {
    render(<SearchResultsPage headline="Custom Headline Text" paginatedData={singlePageData} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Custom Headline Text");
  });

  it("renders the results grid section", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);
    expect(screen.getByLabelText("Search results")).toBeInTheDocument();
  });

  it("renders the pagination component", () => {
    render(<SearchResultsPage paginatedData={sixPageData} />);
    expect(screen.getByTestId("mock-pagination")).toBeInTheDocument();
  });

  it("passes the total item count to the headline", () => {
    render(<SearchResultsPage paginatedData={manyPagesMidData} />);
    expect(screen.getByText(`All ${manyPagesMidData.totalItems} results for`)).toBeInTheDocument();
  });

  it("calls goToPage(1) when sort option changes to refetch sorted data", async () => {
    const user = userEvent.setup({ delay: null });
    const sortableData: PaginatedData<Vehicle> = {
      currentPage: 1,
      totalItems: 3,
      totalPages: 1,
      data: [
        {
          id: "v-1",
          make: "Toyota",
          model: "Highlander",
          year: 2023,
          trim: "Hybrid XLE",
          price: 50_000,
          mileage: 10_000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
        {
          id: "v-2",
          make: "Toyota",
          model: "Highlander",
          year: 2024,
          trim: "Hybrid LE",
          price: 40_000,
          mileage: 8000,
          imageUrl: "/inventory-card/inventory-card2.png",
        },
        {
          id: "v-3",
          make: "Toyota",
          model: "Highlander",
          year: 2022,
          trim: "Hybrid Limited",
          price: 60_000,
          mileage: 5000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
      ],
    };

    // Simulate endpoint returning pre-sorted data when sort is LowestPrice
    let lastSort: SortOrder | undefined;
    mockUseSearchResultsPagination.mockImplementation(({ sort }) => {
      lastSort = sort;
      // Simulate API response: when sort is LowestPrice, v-2 (40k) comes first
      const sortedData: Vehicle[] =
        sort === sortOrderEnum.LowestPrice
          ? [sortableData.data.at(1), sortableData.data.at(0), sortableData.data.at(2)].filter(
              (v): v is Vehicle => v !== undefined
            )
          : sortableData.data;
      return buildHookState({ ...sortableData, data: sortedData });
    });

    render(<SearchResultsPage paginatedData={sortableData} />);

    expect(screen.getByLabelText("Search results")).toHaveTextContent("first:v-1");

    await user.click(screen.getByRole("button", { name: "Trigger sort change" }));

    // Verify that goToPage(1) was called to refetch page 1 with new sort
    expect(mockGoToPage).toHaveBeenCalledWith(1);

    // Verify hook receives the new sort value
    expect(lastSort).toBe(sortOrderEnum.LowestPrice);
  });

  it("passes filters to the hook when initialActiveFilters is provided", () => {
    const filterableData: PaginatedData<Vehicle> = {
      currentPage: 1,
      totalItems: 3,
      totalPages: 1,
      data: [
        {
          id: "v-1",
          make: "Toyota",
          model: "Highlander 1",
          year: 2023,
          trim: "XLE",
          price: 45_000,
          mileage: 10_000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
        {
          id: "v-2",
          make: "Toyota",
          model: "Camry",
          year: 2024,
          trim: "LE",
          price: 30_000,
          mileage: 8000,
          imageUrl: "/inventory-card/inventory-card2.png",
        },
        {
          id: "v-3",
          make: "Toyota",
          model: "Highlander 1",
          year: 2022,
          trim: "Limited",
          price: 50_000,
          mileage: 5000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
      ],
    };

    render(
      <SearchResultsPage
        initialActiveFilters={[{ key: "model", label: "Highlander 1", value: "Highlander 1" }]}
        paginatedData={filterableData}
      />
    );

    // Filters are forwarded to the hook so the endpoint returns filtered data.
    expect(mockUseSearchResultsPagination).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: activeFiltersToSmartFilters([
          { key: "model", label: "Highlander 1", value: "Highlander 1" },
        ]),
      })
    );
  });

  it("calls goToPage(1) and forwards new filters to the hook when filters are applied", async () => {
    const user = userEvent.setup({ delay: null });
    const filterableData: PaginatedData<Vehicle> = {
      currentPage: 1,
      totalItems: 3,
      totalPages: 1,
      data: [
        {
          id: "v-1",
          make: "Toyota",
          model: "Highlander 1",
          year: 2023,
          trim: "XLE",
          price: 45_000,
          mileage: 10_000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
        {
          id: "v-2",
          make: "Toyota",
          model: "Camry",
          year: 2024,
          trim: "LE",
          price: 30_000,
          mileage: 8000,
          imageUrl: "/inventory-card/inventory-card2.png",
        },
        {
          id: "v-3",
          make: "Toyota",
          model: "Highlander 1",
          year: 2022,
          trim: "Limited",
          price: 50_000,
          mileage: 5000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
      ],
    };

    render(<SearchResultsPage paginatedData={filterableData} />);

    await user.click(screen.getByRole("button", { name: "Apply model filter" }));

    // The hook receives the new mapped filters on re-render.
    expect(mockUseSearchResultsPagination).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: activeFiltersToSmartFilters([
          { key: "model", label: "Highlander 1", value: "Highlander 1" },
        ]),
      })
    );

    // Pagination resets to page 1 so results reflect the new filter set.
    expect(mockGoToPage).toHaveBeenCalledWith(1);
  });

  it("calls goToPage(1) and clears filters in the hook when filters are cleared", async () => {
    const user = userEvent.setup({ delay: null });
    const filterableData: PaginatedData<Vehicle> = {
      currentPage: 1,
      totalItems: 2,
      totalPages: 1,
      data: [
        {
          id: "v-1",
          make: "Toyota",
          model: "Highlander 1",
          year: 2023,
          trim: "XLE",
          price: 45_000,
          mileage: 10_000,
          imageUrl: "/inventory-card/inventory-card1.png",
        },
        {
          id: "v-2",
          make: "Toyota",
          model: "Camry",
          year: 2024,
          trim: "LE",
          price: 30_000,
          mileage: 8000,
          imageUrl: "/inventory-card/inventory-card2.png",
        },
      ],
    };

    render(
      <SearchResultsPage
        initialActiveFilters={[{ key: "model", label: "Highlander 1", value: "Highlander 1" }]}
        paginatedData={filterableData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    // Hook receives empty filters after clearing.
    expect(mockUseSearchResultsPagination).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: [] })
    );

    // Pagination resets to page 1.
    expect(mockGoToPage).toHaveBeenCalledWith(1);
  });

  it("records a filter.added activity per newly added filter on apply", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SearchResultsPage paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Apply model filter" }));

    const modelPill = { key: "model", label: "Highlander 1", value: "Highlander 1" };
    const entry = activeFilterToFilterEntry(modelPill);

    expect(mockRecordFilterAddedAction).toHaveBeenCalledTimes(1);
    expect(mockRecordFilterAddedAction).toHaveBeenCalledWith({
      searchId: "test-search-id",
      filter: entry,
      filters: activeFiltersToFilterEntries([modelPill]),
    });
    expect(mockRecordFilterRemovedAction).not.toHaveBeenCalled();
    expect(mockRecordSmartFilterRemovedAction).not.toHaveBeenCalled();
  });

  it("records a filter.removed activity for a removed regular filter on apply", async () => {
    const user = userEvent.setup({ delay: null });
    const modelPill = { key: "model", label: "Highlander 1", value: "Highlander 1" };

    render(<SearchResultsPage initialActiveFilters={[modelPill]} paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(mockRecordFilterRemovedAction).toHaveBeenCalledTimes(1);
    expect(mockRecordFilterRemovedAction).toHaveBeenCalledWith({
      searchId: "test-search-id",
      filter: activeFilterToFilterEntry(modelPill),
      filters: [],
    });
    expect(mockRecordSmartFilterRemovedAction).not.toHaveBeenCalled();
    expect(mockRecordFilterAddedAction).not.toHaveBeenCalled();
  });

  it("records smartFilter.removed (not filter.removed) when a smart filter chip is removed", async () => {
    const user = userEvent.setup({ delay: null });
    const smartPill = {
      key: "model",
      label: "Highlander 1",
      value: "Highlander 1",
      smartFilterName: "Family SUVs under $50k",
    };

    render(<SearchResultsPage initialActiveFilters={[smartPill]} paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(mockRecordSmartFilterRemovedAction).toHaveBeenCalledTimes(1);
    expect(mockRecordSmartFilterRemovedAction).toHaveBeenCalledWith({
      searchId: "test-search-id",
      name: "Family SUVs under $50k",
      filters: [activeFilterToFilterEntry(smartPill)],
    });
    expect(mockRecordFilterRemovedAction).not.toHaveBeenCalled();
  });

  it("groups multiple removed pills sharing a smartFilterName into one smartFilter.removed call", async () => {
    const user = userEvent.setup({ delay: null });
    const smartName = "Family SUVs under $50k";
    const firstPill = {
      key: "model",
      label: "Highlander 1",
      value: "Highlander 1",
      smartFilterName: smartName,
    };
    const secondPill = {
      key: "make",
      label: "Toyota",
      value: "Toyota",
      smartFilterName: smartName,
    };

    render(
      <SearchResultsPage
        initialActiveFilters={[firstPill, secondPill]}
        paginatedData={singlePageData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    // One event per chip name, carrying every mapped filter it represented —
    // not one fragmented event per pill.
    expect(mockRecordSmartFilterRemovedAction).toHaveBeenCalledTimes(1);
    expect(mockRecordSmartFilterRemovedAction).toHaveBeenCalledWith({
      searchId: "test-search-id",
      name: smartName,
      filters: [activeFilterToFilterEntry(firstPill), activeFilterToFilterEntry(secondPill)],
    });
    expect(mockRecordFilterRemovedAction).not.toHaveBeenCalled();
  });

  it("records no activity when apply does not change the active filter set", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <SearchResultsPage
        initialActiveFilters={[{ key: "model", label: "Highlander 1", value: "Highlander 1" }]}
        paginatedData={singlePageData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Apply model filter" }));

    expect(mockRecordFilterAddedAction).not.toHaveBeenCalled();
    expect(mockRecordFilterRemovedAction).not.toHaveBeenCalled();
    expect(mockRecordSmartFilterRemovedAction).not.toHaveBeenCalled();
  });

  it("shows loading semantics while pagination request is in-flight", () => {
    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState(initialData, { isLoading: true })
    );

    render(<SearchResultsPage paginatedData={singlePageData} />);

    // Grid section is marked busy for screen readers
    const gridSection = screen.getByLabelText("Search results").closest("section[aria-busy]");
    expect(gridSection).toHaveAttribute("aria-busy", "true");

    // Grid wrapper is visually faded and non-interactive during loading
    const gridWrapper = screen.getByLabelText("Search results").parentElement;
    expect(gridWrapper).toHaveClass("opacity-40");
    expect(gridWrapper).toHaveClass("pointer-events-none");
  });

  it("shows an assertive error alert when pagination fails", () => {
    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState(initialData, { errorMessage: "Unable to load search results." })
    );

    render(<SearchResultsPage paginatedData={singlePageData} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Unable to load search results.");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveClass("body-md");
    expect(alert).not.toHaveClass("text-sm");
  });

  it("scrolls to the results heading after page changes", () => {
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState({ ...initialData, currentPage: 1 })
    );

    const { rerender } = render(<SearchResultsPage paginatedData={singlePageData} />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState({ ...initialData, currentPage: 2 })
    );

    rerender(<SearchResultsPage paginatedData={singlePageData} />);
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it("updates the URL with page param when page changes", () => {
    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState({ ...initialData, currentPage: 1 })
    );

    const { rerender } = render(<SearchResultsPage paginatedData={singlePageData} />);

    mockUseSearchResultsPagination.mockImplementation(({ initialData }) =>
      buildHookState({ ...initialData, currentPage: 3 })
    );

    rerender(<SearchResultsPage paginatedData={singlePageData} />);

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("page=3"),
      expect.objectContaining({ scroll: false })
    );
  });

  it("updates the URL with sort param when sort changes", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SearchResultsPage paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Trigger sort change" }));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("sort=LowestPrice"),
      expect.objectContaining({ scroll: false })
    );
  });

  it("records a sort-executed activity (fire-and-forget) when the sort changes", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SearchResultsPage paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Trigger sort change" }));

    expect(mockRecordSortExecutedAction).toHaveBeenCalledTimes(1);
    expect(mockRecordSortExecutedAction).toHaveBeenCalledWith({
      searchId: "test-search-id",
      previousSort: sortOrderEnum.Recommended,
      newSort: sortOrderEnum.LowestPrice,
    });
  });

  it("does not record a sort-executed activity on initial render", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);

    expect(mockRecordSortExecutedAction).not.toHaveBeenCalled();
  });

  it("does not record a sort-executed activity when the active sort is re-selected", async () => {
    // Active sort is already LowestPrice — clicking it again is a no-op.
    mockSearchParams.set("sort", sortOrderEnum.LowestPrice);
    const user = userEvent.setup({ delay: null });

    render(<SearchResultsPage paginatedData={singlePageData} />);

    await user.click(screen.getByRole("button", { name: "Trigger sort change" }));

    expect(mockRecordSortExecutedAction).not.toHaveBeenCalled();
  });

  it("does not add params to URL on initial render (clean URL)", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("passes the sort value from the URL query param down to the sort dropdown", () => {
    mockSearchParams.set("sort", sortOrderEnum.LowestPrice);

    render(<SearchResultsPage paginatedData={singlePageData} />);

    expect(screen.getByTestId("sort-value")).toHaveTextContent(sortOrderEnum.LowestPrice);
  });

  it("defaults the sort dropdown value to Recommended when no sort query param is present", () => {
    render(<SearchResultsPage paginatedData={singlePageData} />);

    expect(screen.getByTestId("sort-value")).toHaveTextContent(sortOrderEnum.Recommended);
  });
});
