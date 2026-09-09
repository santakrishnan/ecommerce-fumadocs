import type {
  VehicleDetail as SdkVehicleDetail,
  VehicleInfo as SdkVehicleInfo,
  VehiclePricing as SdkVehiclePricing,
} from "@ucmp/sdk-search-api";
import { z } from "zod";
import type { BffRouteError } from "../errors/bff-route.errors";

// ─── Upstream SDK type extensions ────────────────────────────────────────────
// Extend SDK types only when the Landing BFF adds or removes fields. Consumers
// that need the raw SDK shape should import directly from "@ucmp/sdk-search-api".

/**
 * Extends the SDK VehicleInfo with Landing / Welcome Back colour fields.
 *
 * The SDK VehicleInfo already covers year/make/model/trim etc. This extension
 * adds the colour fields the DealerDealCard uses for swatch display — the same
 * pattern as `VehicleInfoExtended` in the VDP feature (ADR-9).
 */
export interface VehicleInfoUpstream extends SdkVehicleInfo {
  /** Exterior colour label shown on the DealerDealCard (e.g. "Lunar Rock"). */
  exteriorColor?: string;
  /** Colour family for swatch grouping (e.g. "Gray"). */
  exteriorColorFamily?: string;
}

/**
 * Narrows the SDK VehiclePricing for the Landing / Welcome Back response.
 *
 * `invoicePrice` is a dealer-facing field not exposed by the Landing BFF.
 * The DealerDealCard only renders `sellingPrice` (asking price) and `msrp`
 * (struck-through original price).
 */
export type VehiclePricingUpstream = Omit<SdkVehiclePricing, "invoicePrice">;

/**
 * Landing / Welcome Back upstream vehicle detail contract.
 *
 * Extends the SDK `VehicleDetail` — replaces `vehicleInfo` with
 * `VehicleInfoUpstream` (adds colour fields) and `pricing` with
 * `VehiclePricingUpstream` (omits dealer-facing `invoicePrice`).
 *
 * Use this type for fixture data, mappers, and service return types
 * before client-facing Zod validation runs.
 *
 * Note: this is a structural extension of the SDK type, not a bare alias.
 * See `VehicleDetailWithSoldAt` in the VDP feature for the same pattern (ADR-9).
 */
export type VehicleDetailUpstream = Omit<SdkVehicleDetail, "vehicleInfo" | "pricing"> & {
  vehicleInfo: VehicleInfoUpstream;
  pricing: VehiclePricingUpstream;
};

// ─── Validated (client-facing) schemas ───────────────────────────────────
// Strict schemas with constraints for data the BFF returns to the frontend.
// These are BFF-owned and intentionally shape the response for the client.

export const vehiclePricingSchema = z.object({
  msrp: z.number().nonnegative().optional(),
  listPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative().optional(),
});

export const vehicleInfoSchema = z.object({
  year: z.number().int().min(1886).max(2100),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  trim: z.string().min(1).max(100).optional(),
  bodyStyle: z.string().max(100).optional(),
  drivetrain: z.string().max(100).optional(),
  fuelType: z.string().max(100).optional(),
  engine: z.string().max(200).optional(),
  exteriorColor: z.string().max(100).optional(),
  exteriorColorFamily: z.string().max(50).optional(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const vehicleStatusSchema = z.object({
  mileage: z.number().int().min(0),
  daysInStock: z.number().int().min(0).optional(),
  vehicleStatus: z.string().max(100).optional(),
  isCertified: z.boolean().optional(),
});

// BFF-specific media item validation: URLs must be relative or absolute
export const vehicleMediaItemSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine(
      (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
      { message: "Must be a relative path or absolute URL" }
    ),
  displayOrder: z.number().int().min(1),
});

export const vehicleMediaSchema = z.object({
  photos: z.array(vehicleMediaItemSchema).default([]),
  videos: z.array(vehicleMediaItemSchema).default([]),
});

export const vehicleDealerInfoSchema = z.object({
  dealerCode: z.string().min(1),
  dealerName: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const vehicleDetailSchema = z.object({
  vin: z.string().min(17).max(17),
  vehicleId: z.number().int().optional(),
  stockNumber: z.string().optional(),
  vehicleInfo: vehicleInfoSchema,
  dealerInfo: vehicleDealerInfoSchema,
  pricing: vehiclePricingSchema,
  status: vehicleStatusSchema,
  media: vehicleMediaSchema.optional(),
});

/** Platform envelope from the Search API POST /vehicles response */
export const vehicleLookupResponseSchema = z.object({
  data: z.object({
    vehicles: z.array(vehicleDetailSchema),
    notFound: z.array(z.string()),
  }),
  meta: z.object({
    traceId: z.string(),
    timestamp: z.string(),
  }),
});

// ─── Loan Origination / Deal Response ────────────────────────────────────

export const loanOriginationSchema = z.object({
  monthlyPayment: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  msrp: z.number().nonnegative().optional(),
  termMonths: z.number().int().min(1).max(120),
  aprPercent: z.number().min(0).max(100),
  minCreditScore: z.number().int().min(300).max(850),
});

export const vehicleDealResponseSchema = z.object({
  vin: z.string().min(17).max(17),
  financing: loanOriginationSchema,
  urgencyMessage: z.string().max(300).optional(),
  buyNowHref: z.string().min(1),
});

/** Platform envelope from the loan origination service */
export const dealLookupResponseSchema = z.object({
  data: vehicleDealResponseSchema,
  meta: z.object({
    traceId: z.string(),
    timestamp: z.string(),
  }),
});

// ─── Route response types ────────────────────────────────────────────────

export type VehicleDetail = z.infer<typeof vehicleDetailSchema>;
export type VehicleLookupResponse = z.infer<typeof vehicleLookupResponseSchema>;
export type LoanOrigination = z.infer<typeof loanOriginationSchema>;
export type VehicleDealResponse = z.infer<typeof vehicleDealResponseSchema>;
export type DealLookupResponse = z.infer<typeof dealLookupResponseSchema>;

// Re-export BffRouteError for consumers that import all contract types from this file.
export type { BffRouteError } from "../errors/bff-route.errors";

/** Union type for the GET /api/v1/vehicles/[vin] route handler response */
export type VehicleRouteResponse = VehicleDetail | BffRouteError;

/** Union type for the GET /api/v1/vehicles/[vin]/deal route handler response */
export type DealRouteResponse = VehicleDealResponse | BffRouteError;
