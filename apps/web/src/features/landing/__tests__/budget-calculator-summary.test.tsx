import { act, render, screen } from "@ucmp/vitest-config/test-utils";
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

const CURRENCY_REGEX = /\$[\d,]+/;
const START_BROWSING_REGEX = /start browsing/i;
const CTA_HREF_REGEX = /\/search\?budget=\d+&downPayment=3500/;
const CREDIT_SCORE_REGEX = /700\+/i;
const APR_REGEX = /6\.5% APR/i;
const BUDGET_CALCULATOR_REGEX = /budget calculator/i;

describe("BudgetCalculatorShell — Summary & CTA", () => {
  it("shows default-computed budget on first render", async () => {
    await act(async () => {
      render(<BudgetCalculatorShell creditScoreTiers={financingRatesFixture} />);
    });
    const budgetElements = screen.getAllByText(CURRENCY_REGEX);
    expect(budgetElements.length).toBeGreaterThan(0);
  });

  it("CTA is a link with correct href", async () => {
    await act(async () => {
      render(<BudgetCalculatorShell creditScoreTiers={financingRatesFixture} />);
    });
    const cta = screen.getByRole("button", { name: START_BROWSING_REGEX });
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute("href")).toMatch(CTA_HREF_REGEX);
  });

  it("displays credit score and APR info matching calculation", async () => {
    await act(async () => {
      render(<BudgetCalculatorShell creditScoreTiers={financingRatesFixture} />);
    });
    expect(screen.getAllByText(CREDIT_SCORE_REGEX).length).toBeGreaterThan(0);
    expect(screen.getAllByText(APR_REGEX).length).toBeGreaterThan(0);
  });

  it("total budget uses text-6xl on desktop", async () => {
    await act(async () => {
      render(<BudgetCalculatorShell creditScoreTiers={financingRatesFixture} />);
    });
    const section = screen.getByRole("region", { name: BUDGET_CALCULATOR_REGEX });
    const largeNumber = section.querySelector(".number-xl");
    expect(largeNumber).toBeInTheDocument();
  });
});
