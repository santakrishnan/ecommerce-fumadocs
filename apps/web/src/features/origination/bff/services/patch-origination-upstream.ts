import "server-only";

import type { ResolvedBedService } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { PatchOriginationRequest } from "../contracts/patch-origination-request.schema";
import {
  type PatchOriginationResponse,
  patchOriginationResponseSchema,
} from "../contracts/patch-origination-response.schema";
import {
  createOriginationError,
  mapCaughtToOriginationError,
  type OriginationError,
} from "../errors/origination.errors";
import type { Result } from "../lib/result";

/** Path appended to the resolved `origination` BED base URL. */
const PATCH_ORIGINATION_ENDPOINT = (originationId: string) =>
  `/${encodeURIComponent(originationId)}`;

/**
 * PATCHes the BED origination resource on a state transition.
 *
 * The ONLY file that changes when the OpenAPI spec lands — the endpoint path
 * and the `safeParse` shape. The use-case signature, contracts, and fixtures
 * stay put.
 */
export async function patchOriginationUpstream(
  service: ResolvedBedService,
  request: PatchOriginationRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<Result<PatchOriginationResponse, OriginationError>> {
  const client = createBedClient(service, identity);

  try {
    const response = await client.patch(
      PATCH_ORIGINATION_ENDPOINT(request.originationId),
      { step: request.step, status: request.status },
      { headers: { "X-Trace-Id": traceId } }
    );

    const parsed = patchOriginationResponseSchema.safeParse(response);
    if (!parsed.success) {
      return {
        success: false,
        error: createOriginationError(
          "UpstreamError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    return { success: false, error: mapCaughtToOriginationError(error) };
  }
}
