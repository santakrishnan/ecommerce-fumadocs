/**
 * Server-safe exports (no browser APIs).
 * These can be used in Server Components and server-only modules.
 */

/**
 * Client-safe exports (browser APIs — IDB, BroadcastChannel, React hooks).
 * Import these from their direct paths in "use client" modules to avoid
 * pulling server-only guards into the client bundle:
 *
 *   import { idbCollectionOptions } from "@shared/lib/idb-collection/idb-collection-options"
 *   import { idbValueStore, useIdbValue } from "@shared/lib/idb-value-store/idb-value-store"
 *
 * Re-exported here for convenience in server-side or mixed contexts only.
 */
export {
  type IdbCollectionConfig,
  type IdbRecord,
  idbCollectionOptions,
} from "./idb-collection/idb-collection-options";
export { proxyRequest } from "./proxy-handler";
export {
  getVehicleHistoryCollection,
  type VehicleHistoryItem,
  vehicleHistorySchema,
} from "./vehicle-history/vehicle-history-collection";
