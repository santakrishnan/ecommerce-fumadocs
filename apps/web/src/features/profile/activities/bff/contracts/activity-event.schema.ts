import type {
  ActivityAccepted as SdkActivityAccepted,
  ActivityEvent as SdkActivityEvent,
  VisitorActivityType as SdkVisitorActivityType,
} from "@ucmp/sdk-visitor-profile-api";
import { visitorActivityTypeEnum } from "@ucmp/sdk-visitor-profile-api";
import { z } from "zod";

/**
 * SDK type re-exports — canonical shapes from the generated visitor profile API.
 */
export type ActivityEvent = SdkActivityEvent;
export type ActivityAccepted = SdkActivityAccepted;
export type VisitorActivityType = SdkVisitorActivityType;

/**
 * All valid activity type discriminator values.
 */
const ACTIVITY_TYPES = Object.values(visitorActivityTypeEnum) as [string, ...string[]];

/**
 * Runtime validation schema for activity event payloads.
 *
 * Uses a loose schema that validates the discriminator `type` field against
 * the known enum and passes through the rest. Individual event fields are
 * type-checked at compile time via the SDK `ActivityEvent` union — the Zod
 * schema ensures the `type` is valid and the payload is a non-empty object.
 *
 * A strict per-event-type discriminated union schema can be added later if
 * server-side validation needs to reject unknown fields.
 */
export const activityEventSchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES),
  })
  .passthrough();
