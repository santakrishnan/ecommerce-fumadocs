import "server-only";

import {
  BECAUSE_YOU_VIEWED_EMPTY_FIXTURE,
  BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE,
} from "../__fixtures__/because-you-viewed.fixture";
import type { BecauseYouViewedRequest } from "../contracts/because-you-viewed-request.schema";
import type { BecauseYouViewedResponse } from "../contracts/because-you-viewed-response.schema";

const MOCK_DELAY_MS = 50;

export async function mockBecauseYouViewed(
  _request: BecauseYouViewedRequest
): Promise<BecauseYouViewedResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE;
}

export async function mockBecauseYouViewedEmpty(
  _request: BecauseYouViewedRequest
): Promise<BecauseYouViewedResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return BECAUSE_YOU_VIEWED_EMPTY_FIXTURE;
}
