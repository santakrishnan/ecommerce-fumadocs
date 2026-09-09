import "server-only";

import { env } from "@config/env";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { DealerInsightResponse } from "../contracts/dealer-insight-response.schema";
import { dealerInsightResponseSchema } from "../contracts/dealer-insight-response.schema";
import { createVdpError, mapCaughtToVdpError, type VdpError } from "../errors/vdp.errors";
import { mockDealerInsight } from "../services/dealer-insight-mock";

export interface GetDealerInsightInput {
  dealerCode: string;
  traceId: string;
}

export type GetDealerInsightResult =
  | { success: true; data: DealerInsightResponse }
  | { success: false; error: VdpError };

/**
 * Dealer Insight use-case.
 *
 * Fetches expanded dealer information for the Dealer Insight Modal.
 * Phase 1: Returns fixture-backed data via mock service.
 * Phase 2: Will delegate to real Dealer/Places API adapter.
 */
export async function getDealerInsight(
  input: GetDealerInsightInput
): Promise<GetDealerInsightResult> {
  const { dealerCode, traceId: _traceId } = input;
  const useMocks = env.USE_VDP_MOCKS === "true";
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();

  try {
    let result: DealerInsightResponse | null;

    if (upstreamUrl) {
      // Phase 2: Call real Dealer/Places API
      // TODO: Replace with fetchDealerInsight(upstreamUrl, dealerCode, traceId)
      result = await mockDealerInsight(dealerCode);
    } else if (useMocks) {
      result = await mockDealerInsight(dealerCode);
    } else {
      result = null;
    }

    if (!result) {
      return {
        success: false,
        error: createVdpError(
          "VDP_UPSTREAM_UNAVAILABLE",
          "Dealer insight service is not configured (API_UPSTREAM_URL or USE_VDP_MOCKS required)",
          HTTP_STATUS_SERVICE_UNAVAILABLE
        ),
      };
    }

    // Validate response against contract schema
    const validated = dealerInsightResponseSchema.safeParse(result);
    if (!validated.success) {
      console.error(
        "[getDealerInsight] Response payload did not match contract",
        validated.error.issues
      );
      return {
        success: false,
        error: createVdpError(
          "VDP_INTERNAL_ERROR",
          "Dealer insight response payload did not match contract",
          500
        ),
      };
    }

    return { success: true, data: validated.data };
  } catch (error: unknown) {
    return { success: false, error: mapCaughtToVdpError(error) };
  }
}
