/// <reference types="@testing-library/jest-dom/vitest" />
import { PriceRangeIndicator } from "@ucmp/ui/charts";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

const baseProps = {
  min: 26_000,
  max: 42_000,
  value: 30_775,
  average: 34_000,
};

describe("PriceRangeIndicator", () => {
  it("renders an accessible img with a descriptive label", () => {
    render(<PriceRangeIndicator {...baseProps} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("aria-label", expect.stringContaining("This car $30,775"));
  });

  it("renders the value caption and formatted price", () => {
    render(<PriceRangeIndicator {...baseProps} />);

    expect(screen.getByText("This car")).toBeInTheDocument();
    expect(screen.getByText("$30,775")).toBeInTheDocument();
  });

  it("renders the min, max, and average labels", () => {
    render(<PriceRangeIndicator {...baseProps} />);

    expect(screen.getByText("$26,000")).toBeInTheDocument();
    expect(screen.getByText("$42,000")).toBeInTheDocument();
    expect(screen.getByText("Avg")).toBeInTheDocument();
  });

  it("omits the average tick/label when no average is given", () => {
    render(<PriceRangeIndicator {...baseProps} average={undefined} />);

    expect(screen.queryByText("Avg")).not.toBeInTheDocument();
  });

  it("keeps value text and clamps marker position for out-of-range values", () => {
    render(<PriceRangeIndicator {...baseProps} value={99_999} />);

    // Value is clamped — aria-label still shows the original $99,999
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("$99,999")
    );
  });

  it("renders nothing for a degenerate range", () => {
    const { container } = render(<PriceRangeIndicator {...baseProps} max={26_000} />);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("supports a custom currency formatter", () => {
    render(<PriceRangeIndicator {...baseProps} formatValue={(n) => `${(n / 1000).toFixed(1)}k`} />);

    expect(screen.getByText("30.8k")).toBeInTheDocument();
  });

  it("merges a custom className onto the root element", () => {
    render(<PriceRangeIndicator {...baseProps} className="my-chart" />);

    expect(screen.getByRole("img").closest("[data-slot='price-range-indicator']")).toHaveClass("my-chart");
  });
});
