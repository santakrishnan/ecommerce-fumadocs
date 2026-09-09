/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { SearchResultsGrid } from "../components/search-results-grid";
import { MOCK_SEARCH_RESULTS } from "../data/mock-search-results";

describe("SearchResultsGrid", () => {
  it("renders the empty state when no vehicles are provided", () => {
    render(<SearchResultsGrid vehicles={[]} />);
    const status = screen.getByRole("status");

    expect(status).toHaveTextContent("No vehicles found");
    expect(status).toHaveClass("body-md");
    expect(status).not.toHaveClass("text-sm");
  });

  it("renders exactly 24 cards when given 24 vehicles", () => {
    render(<SearchResultsGrid vehicles={MOCK_SEARCH_RESULTS} />);
    const section = screen.getByLabelText("Search results");
    const cards = section.querySelectorAll('[data-slot="card"]');
    // 2 grids × 24 cards = 48 DOM elements (one grid hidden per breakpoint)
    expect(cards.length).toBe(48);
  });

  it("renders all vehicles passed to it (pagination is the shell's responsibility)", () => {
    const extraVehicles = MOCK_SEARCH_RESULTS.concat(
      { ...MOCK_SEARCH_RESULTS[0], id: "v-25" } as (typeof MOCK_SEARCH_RESULTS)[number],
      { ...MOCK_SEARCH_RESULTS[1], id: "v-26" } as (typeof MOCK_SEARCH_RESULTS)[number]
    );
    render(<SearchResultsGrid vehicles={extraVehicles} />);
    const section = screen.getByLabelText("Search results");
    const cards = section.querySelectorAll('[data-slot="card"]');
    // 2 grids × 26 vehicles = 52
    expect(cards.length).toBe(52);
  });

  it("renders a section with accessible label", () => {
    render(<SearchResultsGrid vehicles={MOCK_SEARCH_RESULTS} />);
    expect(screen.getByLabelText("Search results")).toBeInTheDocument();
  });
});
