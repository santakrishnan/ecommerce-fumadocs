/// <reference types="@testing-library/jest-dom" />
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { BudgetCalculatorLoader } from "../components/budget-calculator-loader";
import { getCreditScoreTiers } from "../services/get-credit-score-tiers";

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

vi.mock("../services/get-credit-score-tiers", () => ({
  getCreditScoreTiers: vi.fn(),
}));

vi.mock("../components/budget-calculator-client", () => ({
  BudgetCalculatorShell: ({ creditScoreTiers }: { creditScoreTiers: unknown[] }) => (
    <div data-testid="budget-calculator-shell" data-tiers={creditScoreTiers.length} />
  ),
}));

const mockedGetCreditScoreTiers = vi.mocked(getCreditScoreTiers);

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────

describe("BudgetCalculatorLoader", () => {
  it("renders BudgetCalculatorShell when credit score tiers are available", async () => {
    const tiers = [
      { label: "Excellent", scoreRange: "750+", apr: 0.049 },
      { label: "Good", scoreRange: "700–749", apr: 0.069 },
    ];
    mockedGetCreditScoreTiers.mockResolvedValue(tiers);

    const ui = await BudgetCalculatorLoader();
    const { container } = render(ui);

    expect(container.querySelector('[data-testid="budget-calculator-shell"]')).toBeInTheDocument();
  });

  it("renders nothing when credit score tiers array is empty (section absent from DOM)", async () => {
    mockedGetCreditScoreTiers.mockResolvedValue([]);

    const ui = await BudgetCalculatorLoader();

    expect(ui).toBeNull();
  });

  it("renders nothing when getCreditScoreTiers throws (section absent from DOM)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetCreditScoreTiers.mockRejectedValue(new Error("Service unavailable"));

    const ui = await BudgetCalculatorLoader();

    expect(ui).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[BudgetCalculatorLoader] Failed to load credit score tiers",
      expect.any(Error)
    );
  });

  it("does not render any DOM elements on failure", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetCreditScoreTiers.mockRejectedValue(new Error("timeout"));

    const ui = await BudgetCalculatorLoader();
    expect(ui).toBeNull();

    const { container } = render(ui);
    expect(container).toBeEmptyDOMElement();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
