/**
 * Watchlist contracts — types aligned with @ucmp/sdk-visitor-profile-api.
 *
 * The watchlist BFF is a pass-through to the Visitor Profile Service.
 * Types mirror the SDK's WatchlistVehicle and the upstream POST body.
 */
import type { Meta, WatchlistVehicle } from "@ucmp/sdk-visitor-profile-api";
import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

// ─── Response types (from upstream GET /watchlist) ───────────────────────────

/** A saved vehicle as returned from the Visitor Profile Service watchlist. */
export type WatchlistItem = WatchlistVehicle;

/** Standard response envelope metadata. */
export type WatchlistMeta = Meta;

// ─── Request validation (POST /api/v1/watchlist) ─────────────────────────────

/**
 * Request body for adding a vehicle to the watchlist.
 *
 * All fields are required so the BFF can forward a complete record to the
 * upstream without relying on backend hydration (which may not be available
 * for all vehicles). The `vin` enforces ISO 3779 format.
 */
export const addToWatchlistRequestSchema = z.object({
  vin: z
    .string()
    .length(17, "VIN must be exactly 17 characters")
    .regex(VIN_PATTERN, "Invalid VIN format"),
  vehicleId: z.string().default(""),
  title: z.string().default(""),
  price: z.coerce.number().min(0, "price must be non-negative").default(0),
});

export type AddToWatchlistRequest = z.infer<typeof addToWatchlistRequestSchema>;
