/**
 * Public surface of the profile feature module.
 *
 * Only re-export what other features and the route layer should consume.
 * Internal helpers, services, and fixtures stay private to this folder.
 */

export { addTradeInVehicleAction } from "./actions/add-trade-in-vehicle";
export { lookupTradeInVehicleAction } from "./actions/lookup-trade-in-vehicle";
// ─── BFF Layer ───────────────────────────────────────────────────────
export type { ProfileAppointment } from "./bff/contracts/profile-appointment-response.schema";
export type { ResolvedVisitor } from "./bff/contracts/profile-resolve-response";
export type { ProfileSuggestionsRequest } from "./bff/contracts/profile-suggestions-request.schema";
export { profileSuggestionsRequestSchema } from "./bff/contracts/profile-suggestions-request.schema";
export type { ProfileSuggestionsResponse } from "./bff/contracts/profile-suggestions-response.schema";
export { profileSuggestionsResponseSchema } from "./bff/contracts/profile-suggestions-response.schema";
export type { TradeInVehicle, TradeInVehiclesResponse } from "./bff/contracts/trade-in-response";
export type { ProfileErrorCode } from "./bff/errors/profile.errors";
export type { ProfileErrorBody } from "./bff/errors/profile-error-response";
export { profileErrorResponse } from "./bff/errors/profile-error-response";
export { setProfileResolveIdentityCookies } from "./bff/services/profile-resolve-cookies";
export type { GetProfileAppointmentResult } from "./bff/use-cases/get-profile-appointment";
export type { GetProfileResolveResult } from "./bff/use-cases/get-profile-resolve";
export { getProfileResolve } from "./bff/use-cases/get-profile-resolve";
export type { GetProfileSuggestionsResult } from "./bff/use-cases/get-profile-suggestions";
export { getProfileSuggestions } from "./bff/use-cases/get-profile-suggestions";
export type { GetTradeInVehiclesResult } from "./bff/use-cases/get-trade-in-vehicles";
export type { LookupTradeInVehicleResult } from "./bff/use-cases/lookup-trade-in-vehicle";
export { AddTradeInSkeleton } from "./components/add-trade-in-skeleton";
export { AppointmentModalShell } from "./components/appointment-modal-shell";
export { AppointmentSection } from "./components/appointment-section";
export { AppointmentSkeleton } from "./components/appointment-skeleton";
export { MemberIdCard } from "./components/member-id-card";
export type { MemberIdCardContentProps } from "./components/member-id-card-content";
export { MemberIdCardContent } from "./components/member-id-card-content";
export { MemberIdCardWrapper } from "./components/member-id-card-wrapper";
export type { MemberQRCodeProps } from "./components/member-qr-code";
export { MemberQRCode } from "./components/member-qr-code";
export { ProfileNav } from "./components/profile-nav";
export { ProfilePageContent } from "./components/profile-page-content";
// ─── UI Components ───────────────────────────────────────────────────
export { ProfileSidebar } from "./components/profile-sidebar";
export { ProfileWatchlistContent } from "./components/profile-watchlist-content";
export { SavedSearchesSkeleton } from "./components/saved-searches-skeleton";
export type { TradeInAddVehicleShellProps } from "./components/trade-in-add-vehicle-shell";
export { TradeInAddVehicleShell } from "./components/trade-in-add-vehicle-shell";
export { TradeInModal } from "./components/trade-in-modal";
export { TradeInModalShell } from "./components/trade-in-modal-shell";
export { TradeInSection } from "./components/trade-in-section";
export { WatchlistSkeleton } from "./components/watchlist-skeleton";
