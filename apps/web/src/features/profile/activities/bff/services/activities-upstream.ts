import "server-only";

import { ACTIVITIES_ENDPOINTS, type ResolvedBedService } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { z } from "zod";
import type { ActivityAccepted, ActivityEvent } from "../contracts/activity-event.schema";
import {
  type ActivitiesError,
  createActivitiesError,
  mapCaughtToActivitiesError,
} from "../errors/activities.errors";

type RecordActivityResult =
  | { success: true; data: ActivityAccepted }
  | { success: false; error: ActivitiesError };

/** Validates the upstream response envelope shape. */
const activityAcceptedEnvelopeSchema = z.object({
  data: z.object({ accepted: z.literal(true) }),
});

/**
 * POST /activities — record a single visitor activity event.
 *
 * The upstream responds 202 (accepted for async processing).
 * The response envelope is `{ data: { accepted: true }, meta: {...} }`.
 */
export async function postActivity(
  service: ResolvedBedService,
  event: ActivityEvent,
  identity?: BedVisitorIdentity
): Promise<RecordActivityResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.post(ACTIVITIES_ENDPOINTS.base, event);
    const parsed = activityAcceptedEnvelopeSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        success: false,
        error: createActivitiesError(
          "InternalError",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data: { accepted: true } };
  } catch (error) {
    return { success: false, error: mapCaughtToActivitiesError(error) };
  }
}
