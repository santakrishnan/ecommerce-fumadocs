/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SearchResultsHeadlineWrapper } from "../components/search-results-headline/search-headline-wrapper";

const FILTER_RE = /filters/i;

vi.mock("../components/search-results-headline/search-filter-dialog", () => ({
  SearchFilterDialog: ({ activeFilters }: { activeFilters: { key: string }[] }) => (
    <button type="button">
      Filters
      {activeFilters.length > 0 && <span>{activeFilters.length}</span>}
    </button>
  ),
}));

describe("SearchResultsHeadlineWrapper", () => {
  it("passes count to the inner headline", () => {
    render(<SearchResultsHeadlineWrapper count={24} headline="Highlander Hybrids" />);
    expect(screen.getByText("All 24 results for")).toBeInTheDocument();
  });

  it("passes headline text to the inner headline", () => {
    render(
      <SearchResultsHeadlineWrapper
        count={16}
        headline="Highlander Hybrids with low mileage and top-rated features"
      />
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Highlander Hybrids with low mileage and top-rated features"
    );
  });

  it("renders both h4 count line and h1 headline", () => {
    render(<SearchResultsHeadlineWrapper count={8} headline="Highlander Hybrids" />);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the Filters button", () => {
    render(<SearchResultsHeadlineWrapper count={8} headline="Highlander Hybrids" />);
    expect(screen.getByRole("button", { name: FILTER_RE })).toBeInTheDocument();
  });

  it("shows active filter count on the Filters button when filters are active", () => {
    render(<SearchResultsHeadlineWrapper count={8} headline="Highlander Hybrids" />);
    // The wrapper uses MOCK_ACTIVE_FILTER_PILLS (8 items) from the fixture
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});
