/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { FilterContentPanel } from "../components/filters-dialog/filter-content-panel";
import { FILTER_SECTIONS } from "../components/filters-dialog/filter-sections-data";

// Mock FilterSectionContent so tests don't depend on its internals
vi.mock("../components/filters-dialog/filter-section-content", () => ({
  FilterSectionContent: (_props: { data: unknown }) => <div data-testid="mock-section-content" />,
}));

function Host() {
  return (
    <FilterContentPanel
      activeFilters={[]}
      onFilterSelectionChange={vi.fn()}
      sections={FILTER_SECTIONS}
    />
  );
}

describe("FilterContentPanel", () => {
  it("renders all 12 section headings", () => {
    render(<Host />);
    for (const heading of [
      "Price",
      "Year",
      "Mileage",
      "Make",
      "Model",
      "Trim",
      "Body Style",
      "Color",
      "Fuel Type",
      "Drivetrain",
      "Features",
      "Transmission",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

  it("renders sections in the correct order", () => {
    render(<Host />);
    const labels = screen.getAllByRole("heading").map((h) => h.textContent);
    expect(labels).toEqual([
      "Price",
      "Year",
      "Mileage",
      "Make",
      "Model",
      "Trim",
      "Body Style",
      "Color",
      "Fuel Type",
      "Drivetrain",
      "Features",
      "Transmission",
    ]);
  });

  it("renders each section with the correct id attribute", () => {
    render(<Host />);
    for (const id of [
      "filter-price",
      "filter-year",
      "filter-mileage",
      "filter-make",
      "filter-model",
      "filter-trim",
      "filter-body-style",
      "filter-color",
      "filter-fuel-type",
      "filter-drivetrain",
      "filter-features",
      "filter-transmission",
    ]) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });
});
