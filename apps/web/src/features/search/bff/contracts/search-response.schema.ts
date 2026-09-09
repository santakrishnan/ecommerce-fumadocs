import type {
  DealerInfo,
  InventoryCard,
  MediaItem,
  Meta as SdkMeta,
  SearchResults as SdkSearchResults,
  VehicleInfo,
  VehicleLocation,
  VehicleMedia,
  VehiclePricing,
  VehicleStatus,
} from "@ucmp/sdk-search-api";
import z from "zod";
import type { SmartFilter } from "./filters-response.schema";

// ---------------------------------------------------------------------------
// SDK InventoryCard upstream schema
// ---------------------------------------------------------------------------

const mediaItemSchema: z.ZodType<MediaItem> = z
  .object({
    url: z.string().url(),
    sourceUrl: z.string().nullable().optional(),
    displayOrder: z.number().int().nullable(),
    sourceId: z.string().nullable().optional(),
    capturedAt: z.string().nullable().optional(),
    canonicalAngle: z.string().nullable().optional(),
    classification: z.string().optional(),
    metadata: z.record(z.string(), z.any()).nullable().optional(),
    mediaType: z.string().optional(),
  })
  .passthrough();

const vehicleMediaSchema: z.ZodType<VehicleMedia> = z
  .object({
    photos: z.array(mediaItemSchema).optional(),
    videos: z.array(mediaItemSchema).optional(),
  })
  .passthrough();

const vehicleLocationSchema: z.ZodType<VehicleLocation> = z
  .object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    zipCode: z.string().optional(),
  })
  .passthrough();

const vehicleInfoSchema: z.ZodType<VehicleInfo> = z
  .object({
    year: z.number().int().min(1900).max(2100),
    make: z.string().min(1),
    model: z.string().min(1),
    modelCode: z.string().optional(),
    trim: z.string().optional(),
    style: z.string().optional(),
    engine: z.string().optional(),
    cityMpg: z.number().int().optional(),
    hwyMpg: z.number().int().optional(),
    doorCount: z.string().optional(),
    bodyStyle: z.string().optional(),
    bodyType: z.string().optional(),
    drivetrain: z.string().optional(),
    fuelType: z.string().optional(),
    transmission: z.string().optional(),
    transmissionType: z.string().optional(),
    transmissionSpeeds: z.number().int().optional(),
    exteriorColor: z.string().optional(),
    exteriorColorFamily: z.string().optional(),
    interiorColor: z.string().optional(),
    interiorColorFamily: z.string().optional(),
    interiorMaterial: z.string().optional(),
    isNew: z.boolean().optional(),
    isActive: z.boolean().optional(),
    location: vehicleLocationSchema.optional(),
  })
  .passthrough();

const dealerInfoSchema: z.ZodType<DealerInfo> = z
  .object({
    dealerCode: z.string(),
    dealerName: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .passthrough();

const vehiclePricingSchema: z.ZodType<VehiclePricing> = z
  .object({
    listPrice: z.number().nonnegative(),
    msrp: z.number().nonnegative().optional(),
    sellingPrice: z.number().nonnegative().optional(),
    invoicePrice: z.number().nonnegative().optional(),
  })
  .passthrough();

const vehicleStatusSchema: z.ZodType<VehicleStatus> = z
  .object({
    mileage: z.number().int().nonnegative(),
    daysInStock: z.number().int().nonnegative().optional(),
    vehicleStatus: z.string(),
    isCertified: z.boolean().optional(),
    isSpecial: z.boolean().optional(),
    inStockDate: z.string().optional(),
  })
  .passthrough();

/**
 * Validates the SDK `InventoryCard` shape returned by the upstream search API.
 *
 * Used by the BFF search mapper (`search.mapper.ts`) to type-check each result
 * before it is transformed into the flat {@link Vehicle} shape sent to the
 * client. Sub-schemas use `.passthrough()` so unknown fields from the upstream
 * do not cause validation failures.
 */
export const inventoryCardResponseSchema: z.ZodType<InventoryCard> = z
  .object({
    vin: z.string(),
    vehicleId: z.number().int().optional(),
    stockNumber: z.string().optional(),
    vehicleInfo: vehicleInfoSchema,
    dealerInfo: dealerInfoSchema,
    pricing: vehiclePricingSchema,
    status: vehicleStatusSchema,
    media: vehicleMediaSchema.optional(),
    relevanceScore: z.number().min(0).max(1).optional(),
    /** AI-generated description — mapped to `Vehicle.aiDescription` by the BFF mapper. */
    description: z.string().optional(),
  })
  .passthrough();

type InventoryCardSchemaInferred = z.infer<typeof inventoryCardResponseSchema>;

/**
 * Extends the SDK InventoryCard with upstream-only fields that arrive via
 * `.passthrough()` but aren't in the SDK type (e.g. `computed`). Only
 * `effectivePrice` is read directly here (for price resolution); badge
 * derivation consumes the richer `computed` shape via `vehicle-badges`.
 */
export type InventoryCardResponse = InventoryCardSchemaInferred & {
  /** AI-generated description — preserved via `.passthrough()`, not in SDK type. */
  description?: string;
  computed?: {
    effectivePrice?: number;
    [key: string]: unknown;
  };
};

// ---------------------------------------------------------------------------
// Data envelope
// ---------------------------------------------------------------------------

export interface SearchData
  extends Pick<SdkSearchResults, "searchId" | "totalCount" | "pagination"> {
  /** InventoryCardResponse rather than the bare SDK InventoryCard so that
   * BFF-computed fields (e.g. `computed.effectivePrice`) survive to the FE
   * mapper and can be used for display-price resolution. */
  results: InventoryCardResponse[];
  /** BFF enrichment — not present in SDK SearchResults. */
  smartFilters?: SmartFilter[];
}

// ---------------------------------------------------------------------------
// Meta envelope
// ---------------------------------------------------------------------------

export type SearchMeta = SdkMeta;

// ---------------------------------------------------------------------------
// Full response
// ---------------------------------------------------------------------------

export interface SearchResultsApiResponse {
  data: SearchData;
  meta: SearchMeta;
}
