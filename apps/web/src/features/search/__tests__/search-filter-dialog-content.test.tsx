/// <reference types="@testing-library/jest-dom" />

import { waitFor } from "@testing-library/react";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterDialogContent } from "../components/search-results-headline/search-filter-dialog-content";
import type { ActiveFilter } from "../types/filters";

const CLEAR_ALL_RE = /clear all/i;

vi.mock("@ucmp/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ucmp/ui")>();

  return {
    ...actual,
    // DialogTopBar renders an internal DialogClose that reaches Base UI's
    // DialogPrimitive.Close, which requires a Dialog root context. These tests
    // render SearchFilterDialogContent in isolation (no <Dialog> wrapper), so
    // stub the top bar to avoid the missing-context crash.
    DialogTopBar: ({ children }: { children?: React.ReactNode }) => (
      <div data-slot="dialog-top-bar">{children}</div>
    ),
    DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DialogContent: ({ children }: { children: React.ReactNode }) => (
      <div data-slot="dialog-content">{children}</div>
    ),
  };
});

vi.mock("../hooks/use-filter-data", () => ({
  useFilterData: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

// Prevent filter section content (Hybrid pill, AWD pill, etc.) from
// bleeding into the top-section tests and causing duplicate button matches.
vi.mock("../components/filters-dialog/filter-content-panel", () => ({
  FilterContentPanel: () => <div data-testid="mock-filter-content-panel" />,
}));

function createActiveFilters(): ActiveFilter[] {
  return [
    { key: "fuelTypes", value: "hybrid", label: "Hybrid" },
    { key: "drivetrains", value: "awd", label: "AWD" },
    { key: "models", value: "grand-highlander", label: "Grand Highlander" },
  ];
}

describe("SearchFilterDialogContent top section", () => {
  it("renders selected count and active filter pills", () => {
    const activeFilters = createActiveFilters();

    render(<SearchFilterDialogContent activeFilters={activeFilters} />);

    expect(screen.getByText("Filters · 3 selected")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Active filters" })).toBeInTheDocument();
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
    expect(screen.getByText("AWD")).toBeInTheDocument();
    expect(screen.getByText("Grand Highlander")).toBeInTheDocument();
  });

  it("keeps clear all hidden when no filters are selected", () => {
    render(<SearchFilterDialogContent activeFilters={[]} />);

    expect(screen.getByText("Filters · 0 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).toHaveClass("invisible");
    expect(screen.getByRole("group", { name: "Active filters" })).toBeInTheDocument();
    expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
  });

  it("removes a single pill and updates selected count", async () => {
    const user = userEvent.setup();

    render(<SearchFilterDialogContent activeFilters={createActiveFilters()} />);

    // Click the first Remove button (removes "Hybrid")
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    const firstRemoveButton = removeButtons.at(0);
    if (!firstRemoveButton) {
      throw new Error("Expected at least one Remove button");
    }
    await user.click(firstRemoveButton);

    await waitFor(() => {
      expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
      expect(screen.getByText("Filters · 2 selected")).toBeInTheDocument();
    });

    expect(screen.getByText("AWD")).toBeInTheDocument();
    expect(screen.getByText("Grand Highlander")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).not.toHaveClass("invisible");
  });

  it("clears all pills and updates selected count", async () => {
    const user = userEvent.setup();

    render(<SearchFilterDialogContent activeFilters={createActiveFilters()} />);

    await user.click(screen.getByRole("button", { name: CLEAR_ALL_RE }));

    expect(screen.getByText("Filters · 0 selected")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Active filters" })).toBeInTheDocument();
    expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
    expect(screen.queryByText("AWD")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).toHaveClass("invisible");
  });
});
