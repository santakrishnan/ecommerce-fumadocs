import { Skeleton } from "@ucmp/ui";

/**
 * Loading skeleton for the budget calculator section.
 * Used as the Suspense fallback while credit score tiers load.
 */
export function BudgetCalculatorSkeleton() {
  return <Skeleton className="h-96 rounded-2xl" />;
}
