export {
  type ActivityAccepted,
  type ActivityEvent,
  activityEventSchema,
  type VisitorActivityType,
} from "./contracts/activity-event.schema";
export type { ActivitiesErrorCode } from "./errors/activities.errors";
export { type ActivitiesErrorBody, activitiesErrorResponse } from "./errors/activities.errors";
export { type RecordActivityResult, recordActivity } from "./use-cases/activities";
