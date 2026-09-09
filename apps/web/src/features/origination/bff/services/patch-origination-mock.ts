import "server-only";

import { ORIGINATION_APPLICATION_FIXTURE } from "../__fixtures__/patch-origination.fixture";
import type { OriginationApplication } from "../contracts/origination-model";
import type { PatchOriginationRequest } from "../contracts/patch-origination-request.schema";
import type { PatchOriginationResponse } from "../contracts/patch-origination-response.schema";
import type { OriginationError } from "../errors/origination.errors";
import { mockDelay } from "../lib/mock-delay";
import type { Result } from "../lib/result";

const MOCK_DELAY_MS = 40;
const FINAL_STEP = "review";

/**
 * Mock service for PATCH origination, returned when `USE_ORIGINATION_MOCKS=true`.
 *
 * Returns the unified `OriginationApplication`: the patched step is recorded in
 * the `steps` map with its status + timestamp, becomes `currentStep`, and — when
 * `completed` — is added to `completedSteps`. Reaching the final step flips the
 * lifecycle to `completed`. Stateless: real progress tracking lives upstream, so
 * the returned application reflects only this transition against the fixture.
 */
export async function mockPatchOrigination(
  request: PatchOriginationRequest
): Promise<Result<PatchOriginationResponse, OriginationError>> {
  await mockDelay(MOCK_DELAY_MS);

  const updatedAt = new Date().toISOString();
  const completedSteps = request.status === "completed" ? [request.step] : [];
  const status =
    request.step === FINAL_STEP && request.status === "completed" ? "completed" : "in-progress";

  const steps: OriginationApplication["steps"] = {
    ...ORIGINATION_APPLICATION_FIXTURE.steps,
    [request.step]: { status: request.status, updatedAt },
  };

  return {
    success: true,
    data: {
      ...ORIGINATION_APPLICATION_FIXTURE,
      originationId: request.originationId,
      status,
      currentStep: request.step,
      completedSteps,
      steps,
      updatedAt,
    },
  };
}
