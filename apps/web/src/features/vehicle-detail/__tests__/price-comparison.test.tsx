/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { PRICE_COMPARISON_DEFAULT } from "../bff/__fixtures__/price-comparison.fixtures";
import { PriceComparison } from "../components/price-comparison";

// Biome: regex literals must be at module top level for performance.
const RE_BELOW_MARKET = /priced.*below the market/i;
const RE_ABOVE_MARKET = /priced.*above the market/i;
const RE_CHEAPER_THAN = /7\.7% cheaper than 47 similar vehicles nearby/i;
const RE_MORE_THAN = /15\.5% more than 12 similar vehicles nearby/i;

describe("PriceComparison", () => {
  it("renders headline with price difference", () => {
    render(<PriceComparison data={PRICE_COMPARISON_DEFAULT} />);

    expect(screen.getByText(RE_BELOW_MARKET)).toBeInTheDocument();
  });

  it("renders description from the upstream pricing-card fields", () => {
    render(<PriceComparison data={PRICE_COMPARISON_DEFAULT} />);

    expect(screen.getByText(RE_CHEAPER_THAN)).toBeInTheDocument();
  });

  it("renders above market headline when price exceeds average", () => {
    const aboveMarketData = {
      amountBelowMarketValue: 5300,
      averagePrice: 34_200,
      marketValuePercentage: 15.5,
      nearbyComparedVehiclesCount: 12,
      priceRangeEnd: 42_000,
      priceRangeStart: 26_000,
      thisCarPrice: 39_500,
      valueDirection: "above" as const,
    };

    render(<PriceComparison data={aboveMarketData} />);

    expect(screen.getByText(RE_ABOVE_MARKET)).toBeInTheDocument();
    expect(screen.getByText(RE_MORE_THAN)).toBeInTheDocument();
  });

  it("returns null when data is undefined", () => {
    const { container } = render(
      <PriceComparison data={undefined as unknown as typeof PRICE_COMPARISON_DEFAULT} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the PriceRangeIndicator chart", () => {
    render(<PriceComparison data={PRICE_COMPARISON_DEFAULT} />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("applies custom className to the card", () => {
    render(<PriceComparison className="custom-class" data={PRICE_COMPARISON_DEFAULT} />);

    const card = screen.getByText(RE_BELOW_MARKET).closest("[data-slot='price-comparison']");
    expect(card).toHaveClass("custom-class");
  });
});
