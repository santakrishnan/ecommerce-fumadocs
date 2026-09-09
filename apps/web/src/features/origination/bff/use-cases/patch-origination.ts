import "server-only";

import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { PatchOriginationRequest } from "../contracts/patch-origination-request.schema";
import type { PatchOriginationResponse } from "../contracts/patch-origination-response.schema";
import { createOriginationError, type OriginationError } from "../errors/origination.errors";
import type { Result } from "../lib/result";
import { mockPatchOrigination } from "../services/patch-origination-mock";
import { patchOriginationUpstream } from "../services/patch-origination-upstream";

export type PatchOriginationResult = Result<PatchOriginationResponse, OriginationError>;

/**
 * Use case: record an origination flow state transition (server-only).
 *
 * The frontend PATCHes this same endpoint on every step transition; the
 * response returns only the derived flow position (no PII). Mock/upstream
 * switch:
 *
 * - `USE_ORIGINATION_MOCKS=true`                                      → fixture data (always wins)
 * - `API_UPSTREAM_URL` + `ORIGINATION_API_KEY` via resolveBedService  → PATCHes the BED origination API
 * - Service not resolved                                              → 503 (misconfiguration)
 */
export async function patchOrigination(
  request: PatchOriginationRequest,
  traceId: string,
  identity: BedVisitorIdentity
): Promise<PatchOriginationResult> {
  if (process.env.USE_ORIGINATION_MOCKS === "true") {
    return mockPatchOrigination(request);
  }

  const service = resolveBedService("origination");
  if (!service) {
    return {
      success: false,
      error: createOriginationError(
        "ServiceUnavailable",
        "Origination upstream service is not configured (API_UPSTREAM_URL + ORIGINATION_API_KEY)",
        HTTP_STATUS_SERVICE_UNAVAILABLE
      ),
    };
  }

  return patchOriginationUpstream(service, request, traceId, identity);
}
