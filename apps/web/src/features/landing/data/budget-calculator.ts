/**
 * Data contracts and runtime defaults for the Budget Calculator feature.
 */

/** Default values used to initialise the budget calculator controls. */
export interface BudgetCalculatorDefaults {
  /** Annual percentage rate (decimal, e.g. 0.065 for 6.5%) */
  apr: number;
  /** Minimum credit score assumption for display */
  creditScoreMin: number;
  /** Initial down payment value in USD */
  downPayment: number;
  /** Maximum down payment allowed */
  downPaymentMax: number;
  /** Step increment for down payment slider */
  downPaymentStep: number;
  /** Initial monthly payment value in USD */
  monthlyPayment: number;
  /** Maximum monthly payment allowed */
  monthlyPaymentMax: number;
  /** Step increment for monthly payment slider */
  monthlyPaymentStep: number;
  /** Loan term in months (used for budget calculation) */
  termMonths: number;
}

/** Runtime defaults for the budget calculator — single source of truth. */
export const budgetCalculatorDefaults: BudgetCalculatorDefaults = {
  apr: 0.065,
  creditScoreMin: 700,
  downPayment: 3500,
  downPaymentMax: 5000,
  downPaymentStep: 100,
  monthlyPayment: 250,
  monthlyPaymentMax: 1500,
  monthlyPaymentStep: 50,
  termMonths: 60,
};
