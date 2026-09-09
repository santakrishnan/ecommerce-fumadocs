/**
 * Public surface of the watchlist feature.
 *
 * Consumers import from here — internal hooks, services, and lib modules
 * stay private to this folder.
 */

// ─── Components ──────────────────────────────────────────────────────────────
export type {
  OverflowMenuItem,
  PaymentEstimate,
  WatchlistBadgeData,
  WatchlistCardProps,
} from "./components/watchlist-card";
export { WatchlistCard, WatchlistCardSkeleton } from "./components/watchlist-card";
export {
  WatchlistList,
  type WatchlistListProps,
  type WatchlistVehicleItem,
} from "./components/watchlist-list";
export { WatchlistUndoRow, type WatchlistUndoRowProps } from "./components/watchlist-undo-row";

// ─── Hooks ───────────────────────────────────────────────────────────────────
export {
  type UseBookmarkedVehicleResult,
  useBookmarkedVehicle,
} from "./hooks/use-bookmarked-vehicle";
export { useBookmarkedVehiclesCollection } from "./hooks/use-bookmarked-vehicles-collection";
export {
  type RemovableItem,
  type UseRemovableListOptions,
  type UseRemovableListResult,
  useRemovableList,
} from "./hooks/use-removable-list";

// ─── Lib (collection) ────────────────────────────────────────────────────────
export {
  type BookmarkedVehicleItem,
  bookmarkedVehicleSchema,
  getBookmarkedVehiclesCollection,
} from "./lib/bookmarked-vehicles-collection";
