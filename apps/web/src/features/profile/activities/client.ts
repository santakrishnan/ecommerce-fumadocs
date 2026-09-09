/**
 * Client-safe public entry point for the activities feature.
 *
 * Only exports symbols that are safe to import from Client Components:
 * the browser-facing activity client, the SRP filter-change Server Actions
 * (which Next.js turns into RPC references, never bundling their server
 * implementation), and pure page-type / DTO helpers.
 *
 * Server-only BFF exports (recordActivity, activitiesErrorResponse, etc.) are
 * intentionally excluded — import those from the server-only barrel
 * (`@features/profile/activities`) in Server Components and route handlers only.
 */
export {
  recordFilterAddedAction,
  recordFilterRemovedAction,
  recordSmartFilterRemovedAction,
} from "./actions/record-filter-changed";
export type {
  FilterChangeEntry,
  RecordFilterAddedInput,
  RecordFilterRemovedInput,
  RecordSmartFilterRemovedInput,
} from "./bff/contracts/filter-change-input.schema";
export {
  type ActivityLogEntry,
  CLICKED_REFERRER_KEY,
  fetchActivityLogClient,
  isVinViewSuppressed,
  recordActivityClient,
  setClickedReferrer,
} from "./bff/services/activities-client";
export {
  hasRequiredActivityData,
  useVehicleActivityRecorder,
  type VehicleActivityRef,
} from "./hooks/use-vehicle-activity-recorder";
export type { PageType } from "./page-types";
export { PAGE_TYPE, resolvePageType } from "./page-types";
