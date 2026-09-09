/**
 * Pure helper for computing total vehicle budget from loan parameters.
 *
 * Uses standard loan amortization formula:
 * PV = P * [1 - (1 + r)^-n] / r
 * Total = downPayment + PV
 */

/**
 * Computes the total budget a buyer can afford given their down payment,
 * monthly payment capacity, APR, and loan term.
 *
 * @param downPayment - Upfront cash payment in USD
 * @param monthlyPayment - Maximum monthly payment in USD
 * @param apr - Annual percentage rate as a decimal (e.g. 0.065 for 6.5%)
 * @param termMonths - Loan duration in months
 * @returns Total affordable vehicle price rounded to nearest dollar
 */
// TODO: Revisit actual financing math per requirements in a future iteration,
// along with any other financing/math calculations.
export function computeTotalBudget(
  downPayment: number,
  monthlyPayment: number,
  apr: number,
  termMonths: number
): number {
  const monthlyRate = apr / 12;
  if (monthlyRate === 0) {
    return Math.round(downPayment + monthlyPayment * termMonths);
  }
  const loanAmount = monthlyPayment * ((1 - (1 + monthlyRate) ** -termMonths) / monthlyRate);
  return Math.round(downPayment + loanAmount);
}
