import { devConsole } from "@shared/lib/dev-console";
import { getCreditScoreTiers } from "../services/get-credit-score-tiers";
import { BudgetCalculatorShell } from "./budget-calculator-client";

/**
 * Async leaf Server Component that fetches credit score tiers
 * and passes them to the client calculator shell.
 * Wrapped in <Suspense> by the parent to enable PPR streaming.
 *
 * Returns `null` when credit score tiers are unavailable (fetch failure or
 * empty response), hiding the section entirely from the DOM.
 */
export async function BudgetCalculatorLoader() {
  let creditScoreTiers: Awaited<ReturnType<typeof getCreditScoreTiers>> = [];

  try {
    creditScoreTiers = await getCreditScoreTiers();
  } catch (error) {
    devConsole.error("[BudgetCalculatorLoader] Failed to load credit score tiers", error);
  }

  if (creditScoreTiers.length === 0) {
    return null;
  }

  return <BudgetCalculatorShell creditScoreTiers={creditScoreTiers} />;
}
