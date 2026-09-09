import "server-only";

import { DEALER_INSIGHT_DEFAULT_FIXTURE } from "../__fixtures__/dealer-insight-response.fixture";
import type { DealerInsightResponse } from "../contracts/dealer-insight-response.schema";

/**
 * Mock dealer insight service — returns fixture data for the Dealer Insight Modal.
 *
 * Phase 1: Always returns the default fixture regardless of dealerCode.
 * Phase 2: Will be replaced by `fetchDealerInsight` calling real Dealer/Places API.
 */
export async function mockDealerInsight(_dealerCode: string): Promise<DealerInsightResponse> {
  // Simulate async latency for realistic development
  await new Promise((resolve) => setTimeout(resolve, 50));
  return DEALER_INSIGHT_DEFAULT_FIXTURE;
}
