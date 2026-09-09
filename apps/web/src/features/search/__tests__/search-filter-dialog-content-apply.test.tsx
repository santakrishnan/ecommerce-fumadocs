/// <reference types="@testing-library/jest-dom" />

import { render, screen, userEvent, waitFor } from "@ucmp/vitest-config/test-utils";
import { cloneElement, isValidElement, type MouseEventHandler, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterDialogContent } from "../components/search-results-headline/search-filter-dialog-content";
import type { ActiveFilter } from "../types/filters";

const CLEAR_ALL_RE = /clear all/i;
const APPLY_FILTERS_RE = /apply filters/i;

vi.mock("@ucmp/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ucmp/ui")>();

  return {
    ...actual,
    // DialogTopBar renders an internal DialogClose that reaches Base UI's
    // DialogPrimitive.Close, which requires a Dialog root context. These tests
    // render SearchFilterDialogContent in isolation (no <Dialog> wrapper), so
    // stub the top bar to avoid the missing-context crash.
    DialogTopBar: ({ children }: { children?: ReactNode }) => (
      <div data-slot="dialog-top-bar">{children}</div>
    ),
    DialogClose: ({
      children,
      render,
      onClick,
    }: {
      children?: ReactNode;
      render?: ReactNode;
      onClick?: MouseEventHandler;
    }) => {
      if (isValidElement(render)) {
        // Base UI's DialogClose merges its own props (e.g. onClick) onto the
        // rendered element. Mirror that here so clicking the "Apply filters"
        // button still fires handleApplyFilters. Only override children when
        // DialogClose was given them — otherwise cloneElement would wipe the
        // render element's own children (the button label).
        const merged = { onClick } as Record<string, unknown>;
        return children === undefined
          ? cloneElement(render, merged)
          : cloneElement(render, merged, children);
      }

      return <>{children}</>;
    },
    DialogContent: ({ children }: { children: ReactNode }) => (
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

vi.mock("../components/filters-dialog/filter-content-panel", () => ({
  FilterContentPanel: ({
    onFilterSelectionChange,
  }: {
    onFilterSelectionChange: (filter: ActiveFilter, isSelected: boolean) => void;
  }) => (
    <div data-testid="mock-filter-content-panel">
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "price", label: "$10k or less", value: "10000" }, true)
        }
        type="button"
      >
        Select max price
      </button>
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "price", label: "$15K-$45K", value: "$15K-$45K" }, true)
        }
        type="button"
      >
        Select price range
      </button>
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "mileage", label: "Under 15K mi", value: "15000" }, true)
        }
        type="button"
      >
        Select max mileage
      </button>
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "mileage", label: "10K-45K", value: "10K-45K" }, true)
        }
        type="button"
      >
        Select mileage range
      </button>
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "year", label: "2023 or newer", value: "2023" }, true)
        }
        type="button"
      >
        Select min year
      </button>
      <button
        onClick={() =>
          onFilterSelectionChange({ key: "year", label: "2019-2021", value: "2019-2021" }, true)
        }
        type="button"
      >
        Select year range
      </button>
    </div>
  ),
}));

function createActiveFilters(): ActiveFilter[] {
  return [
    { key: "fuelTypes", value: "hybrid", label: "Hybrid" },
    { key: "drivetrains", value: "awd", label: "AWD" },
    { key: "models", value: "grand-highlander", label: "Grand Highlander" },
  ];
}

describe("SearchFilterDialogContent - Apply Filters", () => {
  it("calls onApplyFilters with current active filters when Apply button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();
    const activeFilters = createActiveFilters();

    render(
      <SearchFilterDialogContent activeFilters={activeFilters} onApplyFilters={onApplyFilters} />
    );

    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    expect(onApplyFilters).toHaveBeenCalledTimes(1);
    expect(onApplyFilters).toHaveBeenCalledWith(activeFilters);
  });

  it("calls onApplyFilters with updated filters after removing a pill", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(
      <SearchFilterDialogContent
        activeFilters={createActiveFilters()}
        onApplyFilters={onApplyFilters}
      />
    );

    // Remove the "Hybrid" filter (first Remove button)
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    const firstRemoveButton = removeButtons.at(0);
    if (!firstRemoveButton) {
      throw new Error("Expected at least one Remove button");
    }
    await user.click(firstRemoveButton);

    // Apply the filters
    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: "AWD" }),
        expect.objectContaining({ label: "Grand Highlander" }),
      ])
    );
    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ label: "Hybrid" })])
    );
  });

  it("calls onApplyFilters with no filters after clearing all", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(
      <SearchFilterDialogContent
        activeFilters={createActiveFilters()}
        onApplyFilters={onApplyFilters}
      />
    );

    // Clear all filters
    await user.click(screen.getByRole("button", { name: CLEAR_ALL_RE }));

    // Apply the filters
    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    expect(onApplyFilters).toHaveBeenCalledWith([]);
  });

  it("calls onApplyFilters with empty filters when no filters initially provided", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(<SearchFilterDialogContent activeFilters={[]} onApplyFilters={onApplyFilters} />);

    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    expect(onApplyFilters).toHaveBeenCalledWith([]);
  });

  it("does not call onApplyFilters when prop is not provided", async () => {
    const user = userEvent.setup({ delay: null });

    // Should not throw an error
    render(<SearchFilterDialogContent activeFilters={createActiveFilters()} />);

    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    // No error should occur
    expect(applyButton).toBeInTheDocument();
  });

  it("maintains filter state through apply action", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();
    const initialFilters = createActiveFilters();

    render(
      <SearchFilterDialogContent activeFilters={initialFilters} onApplyFilters={onApplyFilters} />
    );

    // First apply
    const applyButton = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton);

    expect(onApplyFilters).toHaveBeenNthCalledWith(1, initialFilters);

    // Remove a filter (first Remove button)
    const removeButtons2 = screen.getAllByRole("button", { name: "Remove" });
    const firstRemoveButton = removeButtons2.at(0);
    if (!firstRemoveButton) {
      throw new Error("Expected at least one Remove button");
    }
    await user.click(firstRemoveButton);

    // Second apply
    const applyButton2 = screen.getByRole("button", { name: APPLY_FILTERS_RE });
    await user.click(applyButton2);

    expect(onApplyFilters).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({ label: "AWD" }),
        expect.objectContaining({ label: "Grand Highlander" }),
      ])
    );
  });

  it("replaces the previous price filter with the newest price selection", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(<SearchFilterDialogContent activeFilters={[]} onApplyFilters={onApplyFilters} />);

    await user.click(screen.getByRole("button", { name: "Select max price" }));
    await user.click(screen.getByRole("button", { name: "Select price range" }));
    await user.click(screen.getByRole("button", { name: APPLY_FILTERS_RE }));

    expect(onApplyFilters).toHaveBeenCalledWith([
      { key: "price", label: "$15K-$45K", value: "$15K-$45K" },
    ]);
  });

  it("replaces legacy priceMax when selecting a price filter", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(
      <SearchFilterDialogContent
        activeFilters={[{ key: "priceMax", label: "$35K or less", value: "35000" }]}
        onApplyFilters={onApplyFilters}
      />
    );

    await user.click(screen.getByRole("button", { name: "Select price range" }));
    await user.click(screen.getByRole("button", { name: APPLY_FILTERS_RE }));

    expect(onApplyFilters).toHaveBeenCalledWith([
      { key: "price", label: "$15K-$45K", value: "$15K-$45K" },
    ]);
  });
  it("replaces the previous mileage filter with the newest mileage selection", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(<SearchFilterDialogContent activeFilters={[]} onApplyFilters={onApplyFilters} />);

    await user.click(screen.getByRole("button", { name: "Select max mileage" }));
    await user.click(screen.getByRole("button", { name: "Select mileage range" }));
    await user.click(screen.getByRole("button", { name: APPLY_FILTERS_RE }));

    expect(onApplyFilters).toHaveBeenCalledWith([
      { key: "mileage", label: "10K-45K", value: "10K-45K" },
    ]);
  });

  it("replaces the previous year filter with the newest year selection", async () => {
    const user = userEvent.setup({ delay: null });
    const onApplyFilters = vi.fn();

    render(<SearchFilterDialogContent activeFilters={[]} onApplyFilters={onApplyFilters} />);

    await user.click(screen.getByRole("button", { name: "Select min year" }));
    await user.click(screen.getByRole("button", { name: "Select year range" }));
    await user.click(screen.getByRole("button", { name: APPLY_FILTERS_RE }));

    expect(onApplyFilters).toHaveBeenCalledWith([
      { key: "year", label: "2019-2021", value: "2019-2021" },
    ]);
  });

  describe("filter pill display and management", () => {
    it("renders selected count and active filter pills", () => {
      const activeFilters = createActiveFilters();

      render(<SearchFilterDialogContent activeFilters={activeFilters} />);

      expect(screen.getByText("Filters · 3 selected")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Active filters" })).toBeInTheDocument();
      expect(screen.getByText("Hybrid")).toBeInTheDocument();
      expect(screen.getByText("AWD")).toBeInTheDocument();
      expect(screen.getByText("Grand Highlander")).toBeInTheDocument();
    });

    it("keeps clear all button hidden when no filters are selected", () => {
      render(<SearchFilterDialogContent activeFilters={[]} />);

      expect(screen.getByText("Filters · 0 selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).toHaveClass("invisible");
    });

    it("removes a single pill and updates selected count", async () => {
      const user = userEvent.setup({ delay: null });

      render(<SearchFilterDialogContent activeFilters={createActiveFilters()} />);

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
      expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).not.toHaveClass("invisible");
    });

    it("clears all pills and updates selected count", async () => {
      const user = userEvent.setup({ delay: null });

      render(<SearchFilterDialogContent activeFilters={createActiveFilters()} />);

      await user.click(screen.getByRole("button", { name: CLEAR_ALL_RE }));

      expect(screen.getByText("Filters · 0 selected")).toBeInTheDocument();
      expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
      expect(screen.queryByText("AWD")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: CLEAR_ALL_RE })).toHaveClass("invisible");
    });
  });
});
