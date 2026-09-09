"use client";

import { ROUTES } from "@config/routes/constants";
import { Button, Card, CardContent } from "@ucmp/ui";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "utils";
import { RangeSlider } from "~/shared/components/range-slider";
import { budgetCalculatorDefaults } from "../data/budget-calculator";
import { useAnimatedValue } from "../hooks/use-animated-value";
import { computeTotalBudget } from "../lib/budget";
import type { CreditScoreTier } from "../services/financing-rate-service";

/** Props for the BudgetCalculatorShell component. */
export interface BudgetCalculatorShellProps {
  /** Credit score tiers resolved server-side and passed as plain data. */
  creditScoreTiers: CreditScoreTier[];
}

/**
 * Budget Calculator — interactive Client Component with dual sliders for
 * down payment and monthly payment, displaying a computed total budget.
 * CTA navigates to search results filtered by budget.
 */
export function BudgetCalculatorShell({
  // TODO: Wire creditScoreTiers to credit score grid once Figma design is available (Story 5.3 AC-4)
  creditScoreTiers: _creditScoreTiers,
}: BudgetCalculatorShellProps) {
  const [downPayment, setDownPayment] = useState(budgetCalculatorDefaults.downPayment);
  const [monthlyPayment, setMonthlyPayment] = useState(budgetCalculatorDefaults.monthlyPayment);

  const totalBudget = computeTotalBudget(
    downPayment,
    monthlyPayment,
    budgetCalculatorDefaults.apr,
    budgetCalculatorDefaults.termMonths
  );

  const animatedBudget = useAnimatedValue(totalBudget);
  const formattedBudget = formatPrice(animatedBudget);

  const ctaHref = `${ROUTES.SEARCH}?budget=${Math.round(totalBudget)}&downPayment=${downPayment}`;

  return (
    <section aria-label="Budget calculator">
      <div className="">
        <Card className="w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-surface-primary py-0 text-left shadow-none ring-0 lg:flex-row lg:rounded-2xl xl:min-h-146.5">
          {/* Left section — sliders */}
          <CardContent className="flex flex-1 flex-col justify-center px-5 py-8 pt-18 pb-12 md:px-10 lg:pt-9 lg:pr-20 lg:pl-8">
            <h2 className="h1 text-text-primary">Shop cars that fit your budget</h2>

            <div className="mt-14 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 xl:**:data-[slot=slider-track]:data-[orientation=horizontal]:h-2 xl:**:data-[slot=slider-thumb]:size-8 xl:**:data-[slot=slider-track]:data-[orientation=horizontal]:before:h-1.5">
              {/* Down Payment */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="body-lg text-text-primary">Down Payment</p>
                  <p className="number-lg text-text-primary lg:hidden">
                    {formatPrice(downPayment)}
                  </p>
                </div>
                <p className="number-xl mt-9 hidden text-text-primary lg:block">
                  {formatPrice(downPayment)}
                </p>
                <div className="mt-4">
                  <RangeSlider
                    aria-label="Down payment amount in dollars"
                    formatValue={formatPrice}
                    max={budgetCalculatorDefaults.downPaymentMax}
                    min={0}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      if (typeof next === "number") {
                        setDownPayment(next);
                      }
                    }}
                    step={budgetCalculatorDefaults.downPaymentStep}
                    value={[downPayment]}
                  />
                </div>
              </div>

              {/* Monthly Payment */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="body-lg text-text-primary">Monthly Payment</p>
                  <p className="number-lg text-text-primary lg:hidden">
                    {formatPrice(monthlyPayment)}
                  </p>
                </div>
                <p className="number-xl mt-9 hidden text-text-primary lg:block">
                  {formatPrice(monthlyPayment)}
                </p>
                <div className="mt-4">
                  <RangeSlider
                    aria-label="Maximum monthly payment in dollars"
                    formatValue={formatPrice}
                    max={budgetCalculatorDefaults.monthlyPaymentMax}
                    min={0}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val;
                      if (typeof next === "number") {
                        setMonthlyPayment(next);
                      }
                    }}
                    step={budgetCalculatorDefaults.monthlyPaymentStep}
                    value={[monthlyPayment]}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          {/* Right/Bottom section — budget summary */}
          <CardContent className="px-5 pb-9 md:px-10 lg:p-4 lg:py-2.5 lg:pr-2.5 lg:pl-0">
            <div className="flex flex-col items-center rounded-2xl bg-surface-secondary px-5 py-5 lg:h-full lg:w-109.5 lg:shrink-0 lg:justify-center lg:rounded-r-2xl lg:px-8 lg:py-8 xl:w-123">
              {/* Mobile/Tablet layout: horizontal */}
              <div className="flex w-full items-center justify-between lg:hidden">
                <div>
                  <p className="subhead-lg text-text-primary">Your Budget</p>
                  <p className="body-md text-text-tertiary">
                    Based on a credit score
                    <br />
                    of {budgetCalculatorDefaults.creditScoreMin}+{" "}
                    {(budgetCalculatorDefaults.apr * 100).toFixed(1)}% APR
                  </p>
                </div>
                <p className="number-lg text-text-primary">{formattedBudget}</p>
              </div>

              {/* Desktop layout: vertical centered */}
              <div className="hidden lg:flex lg:flex-col lg:items-center">
                <p className="subhead-lg text-text-primary">Your Budget</p>
                <p className="number-xl text-text-primary lg:mt-11">{formattedBudget}</p>
                <p className="body-lg mt-3 text-center text-text-tertiary lg:mt-5">
                  Based on a credit score of {budgetCalculatorDefaults.creditScoreMin}+
                  <br />
                  {(budgetCalculatorDefaults.apr * 100).toFixed(1)}% APR
                </p>
              </div>

              <div className="mt-4 h-14 w-full lg:mt-12 xl:h-21">
                <Button
                  aria-label="Start browsing for vehicles in your budget"
                  className="h-full w-full"
                  nativeButton={false}
                  render={<Link href={ctaHref} />}
                >
                  Start browsing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
