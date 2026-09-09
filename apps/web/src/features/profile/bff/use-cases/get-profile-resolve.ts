import "server-only";

import { resolveBedService } from "@config/bed-services";
import { env } from "@config/env";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { ResolvedVisitor } from "../contracts/profile-resolve-response";
import { createProfileError, type ProfileError } from "../errors/profile.errors";
import { mockProfileResolve } from "../services/profile-resolve-mock";
import { fetchProfileResolve } from "../services/profile-resolve-upstream";

export type GetProfileResolveResult =
  | { success: true; data: ResolvedVisitor }
  | { success: false; error: ProfileError };

export async function getProfileResolve(fingerprintId: string): Promise<GetProfileResolveResult> {
  if (env.USE_PROFILE_MOCKS === "true") {
    return { success: true, data: await mockProfileResolve(fingerprintId) };
  }

  const visitors = resolveBedService("visitors");

  if (visitors) {
    // Forward the already-resolved identity so BED can resume the session.
    const identity = await readVisitorIdentity();
    return fetchProfileResolve(visitors, fingerprintId, identity);
  }

  return {
    success: false,
    error: createProfileError(
      "PROFILE_UPSTREAM_UNAVAILABLE",
      "Visitors BED service is not configured (API_UPSTREAM_URL + VISITORS_API_KEY) and USE_PROFILE_MOCKS is not enabled",
      HTTP_STATUS_SERVICE_UNAVAILABLE
    ),
  };
}
