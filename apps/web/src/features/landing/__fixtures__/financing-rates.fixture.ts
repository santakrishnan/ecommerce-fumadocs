import type { CreditScoreTier } from "../services/financing-rate-service";

/**
 * Editable fixture for credit score tiers — single source of truth for V1.
 * Business teams update this file to change tier names, score ranges, and APRs.
 * No component code changes required.
 */
export const financingRatesFixture: CreditScoreTier[] = [
  { label: "Excellent", scoreRange: "720+", apr: 0.045 },
  { label: "Good", scoreRange: "680–719", apr: 0.065 },
  { label: "Fair", scoreRange: "640–679", apr: 0.095 },
  { label: "Poor", scoreRange: "< 640", apr: 0.149 },
];
