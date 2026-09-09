import type { OriginationApplication } from "../contracts/origination-model";

/**
 * Typed fixture for the unified origination application. `satisfies` keeps it
 * aligned with the canonical model. The mock service overrides `currentStep`,
 * `completedSteps`, `steps`, `status`, and `updatedAt` from the incoming
 * request at call time.
 */
export const ORIGINATION_APPLICATION_FIXTURE: OriginationApplication = {
  originationId: "22222222-2222-4222-8222-222222222222",
  status: "in-progress",
  currentStep: "phone-verification",
  completedSteps: [],
  steps: {},
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies OriginationApplication;
