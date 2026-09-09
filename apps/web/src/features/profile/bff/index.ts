export type {
  InventoryItem,
  InventoryUpstreamItem,
  inventorySchema,
  inventoryUpstreamSchema,
} from "@features/vehicle-detail/bff";
export type { ProfileAppointment } from "./contracts/profile-appointment-response.schema";
export type { ResolvedVisitor } from "./contracts/profile-resolve-response";
export {
  type ProfileSuggestionsRequest,
  profileSuggestionsRequestSchema,
} from "./contracts/profile-suggestions-request.schema";
export {
  type ProfileSuggestionsResponse,
  profileSuggestionsResponseSchema,
} from "./contracts/profile-suggestions-response.schema";
export type { TradeInVehicle, TradeInVehiclesResponse } from "./contracts/trade-in-response";
export type { ProfileErrorCode } from "./errors/profile.errors";
export {
  type ProfileErrorBody,
  profileErrorResponse,
} from "./errors/profile-error-response";
export { setProfileResolveIdentityCookies } from "./services/profile-resolve-cookies";
export { getAppointmentVariant } from "./use-cases/get-appointment-variant";
export {
  type GetProfileAppointmentResult,
  getProfileAppointment,
} from "./use-cases/get-profile-appointment";
export {
  type GetProfileResolveResult,
  getProfileResolve,
} from "./use-cases/get-profile-resolve";
export {
  type GetProfileSuggestionsResult,
  getProfileSuggestions,
} from "./use-cases/get-profile-suggestions";
export { getProfileTier } from "./use-cases/get-profile-tier";
export {
  type GetTradeInVehiclesResult,
  getTradeInVehicles,
} from "./use-cases/get-trade-in-vehicles";
export {
  type LookupTradeInVehicleResult,
  lookupTradeInVehicle,
} from "./use-cases/lookup-trade-in-vehicle";
