import "server-only";

import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { createLogger } from "@shared/lib/logger";
import type { ActivityEvent } from "@ucmp/sdk-visitor-profile-api";
import type { AnonymousVehicleActivityInput } from "../contracts/vehicle-activity-input.schema";
import { appendActivityDebugEntry } from "../lib/activity-debug-store";
import { recordActivity } from "./activities";

const log = createLogger("record-vehicle-activity");

/**
 * BFF use-case: record a single vehicle activity event.
 *
 * Accepts a validated AnonymousVehicleActivityInput — the Zod discriminated
 * union at the Server Action boundary guarantees required fields are present
 * before this function is called.
 *
 * Reads visitor identity from httpOnly cookies server-side and merges it into
 * the event payload — callers never supply visitorId/sessionId.
 * Silently skips when identity is unresolved. Fire-and-forget: never
 * throws. Logs each outcome for server-side observability.
 *
 * In development, every outcome (success, skip, error) is appended to the
 * in-memory activity debug ring buffer so the /visitor/debug Activity Log
 * surfaces real app events alongside manually fired debug console events.
 */
export async function recordVehicleActivity(event: AnonymousVehicleActivityInput): Promise<void> {
  try {
    const identity = await readVisitorIdentity();

    if (!(identity.visitorId && identity.sessionId)) {
      log.debug("skip: unresolved visitor identity", { type: event.type });
      return;
    }

    const fullEvent: ActivityEvent = {
      ...event,
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
    };

    const result = await recordActivity(fullEvent);

    if (result.success) {
      log.debug("recorded vehicle activity", { type: event.type });
      appendActivityDebugEntry(identity.visitorId, { type: event.type, status: "success" });
    } else {
      log.warn("failed to record vehicle activity", {
        type: event.type,
        code: result.error.code,
        message: result.error.message,
      });
      appendActivityDebugEntry(identity.visitorId, {
        type: event.type,
        status: "error",
        reason: result.error.message,
      });
    }
  } catch (error) {
    // Fire-and-forget: never let activity recording affect the caller.
    log.warn("unexpected error recording vehicle activity", {
      type: event.type,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
