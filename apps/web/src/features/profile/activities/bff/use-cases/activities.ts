import "server-only";

import { resolveBedService } from "@config/bed-services";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type { ActivityAccepted, ActivityEvent } from "../contracts/activity-event.schema";
import { type ActivitiesError, createActivitiesError } from "../errors/activities.errors";
import { postActivity } from "../services/activities-upstream";

export type RecordActivityResult =
  | { success: true; data: ActivityAccepted }
  | { success: false; error: ActivitiesError };

const NOT_CONFIGURED = createActivitiesError(
  "InternalError",
  "Visitors upstream service is not configured (API_UPSTREAM_URL + VISITORS_API_KEY)",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

/**
 * Use case: record a single visitor activity event.
 *
 * Resolves the visitors BED service and reads identity from cookies.
 * The identity (visitorId + sessionId) is forwarded via headers to the
 * upstream, which validates the session and extends the sliding TTL.
 */
export async function recordActivity(event: ActivityEvent): Promise<RecordActivityResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return postActivity(visitors, event, identity);
}
