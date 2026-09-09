/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterDialog } from "../components/search-results-headline/search-filter-dialog";

const FILTER_RE = /filters/i;
const NUMBER_RE = /\d+/;

vi.mock("../components/search-results-headline/search-filter-dialog-content", () => ({
  SearchFilterDialogContent: () => <div data-testid="mock-filter-dialog-content" />,
}));

describe("SearchFilterDialog", () => {
  it("renders the Filters button", () => {
    render(<SearchFilterDialog activeFilters={[]} />);
    expect(screen.getByRole("button", { name: FILTER_RE })).toBeInTheDocument();
  });

  it("does not show a count badge when there are no active filters", () => {
    render(<SearchFilterDialog activeFilters={[]} />);
    const button = screen.getByRole("button", { name: FILTER_RE });
    expect(button).not.toHaveTextContent(NUMBER_RE);
  });

  it("shows the active filter count when filters are selected", () => {
    const activeFilters = [
      { key: "fuelTypes", value: "Hybrid", label: "Hybrid" },
      { key: "drivetrains", value: "AWD", label: "AWD" },
    ];
    render(<SearchFilterDialog activeFilters={activeFilters} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("updates the count when a different number of filters is passed", () => {
    const activeFilters = [
      { key: "models", value: "Highlander", label: "Highlander" },
      { key: "fuelTypes", value: "Hybrid", label: "Hybrid" },
      { key: "drivetrains", value: "AWD", label: "AWD" },
    ];
    render(<SearchFilterDialog activeFilters={activeFilters} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
