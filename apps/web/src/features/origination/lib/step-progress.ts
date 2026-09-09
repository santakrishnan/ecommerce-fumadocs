import type { OriginationStep } from "../bff/contracts/origination-model";

/**
 * Flow order of origination steps, the single source of truth for progress.
 * Deliberately distinct from `originationStepEnum`'s declaration order (where
 * `entry` sits mid-list), so it cannot be derived from the enum.
 */
export const ORIGINATION_STEP_ORDER: readonly OriginationStep[] = [
  "purchase-method",
  "own-or-coapplicant-financing",
  "entry",
  "phone-verification",
  "otp-verification",
  "identity",
  "trade-in",
  "down-payment",
  "income",
  "credit-check",
  "offers",
  "scheduling",
  "extra-savings",
  "review",
] as const;

/**
 * Map a flow step to a progress value (0–100), 1-based so the first step is
 * already partway filled and the last reads 100. Unknown steps return 0.
 */
export function stepToProgress(step: OriginationStep): number {
  const index = ORIGINATION_STEP_ORDER.indexOf(step);
  if (index === -1) {
    return 0;
  }

  const total = ORIGINATION_STEP_ORDER.length;
  return Math.round(((index + 1) / total) * 100);
}
