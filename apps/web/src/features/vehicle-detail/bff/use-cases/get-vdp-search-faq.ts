import "server-only";

import { env } from "@config/env";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@shared/lib/http/status-codes";
import {
  type VdpSearchFaqApiResponse,
  vdpSearchFaqApiResponseSchema,
} from "../contracts/vdp-search-faq.schema";
import type { VdpError } from "../errors/vdp.errors";
import { createVdpError } from "../errors/vdp.errors";
import { mockVdpSearchFaq } from "../services/vdp-search-faq-mock";

export interface GetVdpSearchFaqInput {
  question: string;
  traceId: string;
  vin: string;
}

export type GetVdpSearchFaqResult =
  | { success: true; data: VdpSearchFaqApiResponse }
  | { success: false; error: VdpError };

/**
 * Upstream Search FAQ call — placeholder for when the sandbox API becomes available.
 *
 * TODO: Uncomment the call to this in `getVdpSearchFaq` once the Search FAQ
 * sandbox endpoint is live. The upstream service contract should return the
 * same `VdpSearchFaqApiResponse` shape.
 */
// @ts-expect-error — intentionally unused until the Search FAQ sandbox becomes available
async function _searchFaqUpstream(
  _vin: string,
  _question: string,
  _traceId: string
): Promise<VdpSearchFaqApiResponse | null> {
  // Future: call the real BED search FAQ endpoint here.
  // e.g. const service = resolveBedService("search");
  //      const client = createBedClient(service, identity);
  //      return client.get(`/faq?vin=${vin}&question=${encodeURIComponent(question)}`);
  return null;
}

/**
 * VDP Search FAQ use-case.
 *
 * Routes to mocks or the upstream search FAQ service based on environment config.
 * Currently always uses mocks — the upstream BED service does not have a search
 * FAQ implementation yet.
 */
export async function getVdpSearchFaq(input: GetVdpSearchFaqInput): Promise<GetVdpSearchFaqResult> {
  const { vin, question } = input;
  const upstreamUrl = env.API_UPSTREAM_URL?.trim();
  const useMocks = env.USE_VDP_MOCKS === "true";

  try {
    let responseData: VdpSearchFaqApiResponse | null = null;

    if (!useMocks && upstreamUrl) {
      // TODO: Uncomment this when the Search FAQ sandbox becomes available.
      // responseData = await _searchFaqUpstream(vin, question, input.traceId);
      responseData = await mockVdpSearchFaq(vin, question, input.traceId);
    } else {
      responseData = await mockVdpSearchFaq(vin, question, input.traceId);
    }

    if (!responseData) {
      return {
        error: createVdpError(
          "VDP_UPSTREAM_UNAVAILABLE",
          "VDP Search FAQ upstream service is not yet implemented",
          HTTP_STATUS_SERVICE_UNAVAILABLE
        ),
        success: false,
      };
    }

    const validated = vdpSearchFaqApiResponseSchema.safeParse(responseData);
    if (!validated.success) {
      return {
        error: createVdpError(
          "VDP_INTERNAL_ERROR",
          "VDP Search FAQ response payload did not match contract",
          HTTP_STATUS_INTERNAL_SERVER_ERROR
        ),
        success: false,
      };
    }

    return {
      data: {
        ...validated.data,
        meta: {
          ...validated.data.meta,
          traceId: input.traceId,
        },
      },
      success: true,
    };
  } catch {
    return {
      error: createVdpError(
        "VDP_INTERNAL_ERROR",
        "An unexpected error occurred while processing the VDP Search FAQ request",
        HTTP_STATUS_INTERNAL_SERVER_ERROR
      ),
      success: false,
    };
  }
}
