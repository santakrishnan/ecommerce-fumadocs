import { act, beforeEach, render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { financingRatesFixture } from "../__fixtures__/financing-rates.fixture";
import { BudgetCalculatorShell } from "../components/budget-calculator-client";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const BUDGET_CALCULATOR_REGEX = /budget calculator/i;
const START_BROWSING_REGEX = /start browsing/i;
const DOWN_PAYMENT_LABEL_REGEX = /down payment amount/i;
const MONTHLY_PAYMENT_LABEL_REGEX = /maximum monthly payment/i;
const CTA_HREF_REGEX = /\/search\?budget=\d+&downPayment=3500/;
const APR_REGEX = /6\.5% APR/i;

describe("BudgetCalculatorShell", () => {
  beforeEach(async () => {
    await act(async () => {
      render(<BudgetCalculatorShell creditScoreTiers={financingRatesFixture} />);
    });
  });

  it("renders a section landmark with aria-label='Budget calculator'", () => {
    const section = screen.getByRole("region", { name: BUDGET_CALCULATOR_REGEX });
    expect(section).toBeInTheDocument();
  });

  it("section title, control area, summary panel, and CTA are present", () => {
    expect(screen.getByText("Shop cars that fit your budget")).toBeInTheDocument();
    expect(screen.getByText("Down Payment")).toBeInTheDocument();
    expect(screen.getByText("Monthly Payment")).toBeInTheDocument();
    expect(screen.getAllByText("Your Budget").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: START_BROWSING_REGEX })).toBeInTheDocument();
  });

  it("default values display before any interaction", () => {
    const downValues = screen.getAllByText("$3,500");
    expect(downValues.length).toBeGreaterThan(0);
    const monthlyValues = screen.getAllByText("$250");
    expect(monthlyValues.length).toBeGreaterThan(0);
  });

  it("sliders have proper aria-labels for accessibility", () => {
    expect(screen.getByLabelText(DOWN_PAYMENT_LABEL_REGEX)).toBeInTheDocument();
    expect(screen.getByLabelText(MONTHLY_PAYMENT_LABEL_REGEX)).toBeInTheDocument();
  });

  it("two-column grid layout classes present for responsive design", () => {
    const section = screen.getByRole("region", { name: BUDGET_CALCULATOR_REGEX });
    const grid = section.querySelector(".lg\\:grid-cols-2");
    expect(grid).toBeInTheDocument();
  });

  it("CTA href includes budget and downPayment params", () => {
    const cta = screen.getByRole("button", { name: START_BROWSING_REGEX });
    expect(cta.getAttribute("href")).toMatch(CTA_HREF_REGEX);
  });

  it("displays 6.5% APR in summary panel", () => {
    expect(screen.getAllByText(APR_REGEX).length).toBeGreaterThan(0);
  });
});
