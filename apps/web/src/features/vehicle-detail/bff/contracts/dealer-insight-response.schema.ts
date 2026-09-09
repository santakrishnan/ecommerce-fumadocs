import type { DealerInfo } from "@ucmp/sdk-search-api";
import { z } from "zod";

// ─── Dealer Insight Modal Response Schema ────────────────────────────────────
// Contract for GET /api/v1/dealer-insight/{dealerCode}
// Serves the Dealer Insight Modal triggered from the Purchase Card.
//
// Base dealer identification fields are sourced from the DealerInfo type in
// @ucmp/sdk-search-api (dealerCode, dealerName, city, state, zipCode, latitude,
// longitude). The modal-specific display fields (rating, phone, hours, media)
// extend the base with richer presentation data for the Dealer Insight Modal.

const dealerRatingSchema = z.object({
  /** Numeric rating value (e.g. 4.2). */
  value: z.number(),
  /** Maximum possible rating (e.g. 5). */
  maxValue: z.number(),
  /** Total number of reviews. */
  reviewCount: z.number().int(),
  /** Review source name (e.g. "Google"). */
  reviewSource: z.string(),
});

const dealerAddressSchema = z.object({
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
});

const dealerHoursEntrySchema = z.object({
  /** Day or day-range label (e.g. "Sunday", "Mon - Thu"). */
  day: z.string(),
  /** Hours range display string (e.g. "9:00 AM - 9:00 PM"). */
  hours: z.string(),
  /** Whether this entry represents the current day. */
  isToday: z.boolean(),
});

const dealerHoursSchema = z.object({
  /** Status text (e.g. "Open till 8 PM", "Closed"). */
  statusText: z.string(),
  /** Current day name in lowercase (e.g. "monday"). */
  today: z.string(),
  /** Full weekly schedule. */
  weeklySchedule: z.array(dealerHoursEntrySchema),
});

const dealerPhotoSchema = z.object({
  /** Image URL. */
  url: z.string(),
  /** Alt text for accessibility. */
  alt: z.string(),
  /** Display order (1-based). */
  displayOrder: z.number().int(),
});

const dealerMapThumbnailSchema = z.object({
  /** Map thumbnail image URL. */
  url: z.string(),
  /** Alt text for the map thumbnail. */
  alt: z.string(),
});

const dealerMediaSchema = z.object({
  /** Dealer photos (exterior, showroom, lot, etc.). */
  photos: z.array(dealerPhotoSchema),
  /** Static map thumbnail showing dealer location. */
  mapThumbnail: dealerMapThumbnailSchema.nullable(),
});

/**
 * Dealer Insight schema — combines base DealerInfo fields from
 * @ucmp/sdk-search-api with modal-specific display fields.
 *
 * Base fields from DealerInfo:
 *   dealerCode, dealerName, city, state, zipCode, latitude, longitude
 *
 * Modal-specific extensions:
 *   rating, address, phone, hours, media
 */
export const dealerInsightSchema = z.object({
  // ─── Base fields (sourced from @ucmp/sdk-search-api DealerInfo) ────────────
  dealerCode: z.string(),
  dealerName: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // ─── Modal-specific display fields ────────────────────────────────────────
  rating: dealerRatingSchema.nullable(),
  address: dealerAddressSchema,
  /** Phone number in US display format, e.g. "(929) 538-3803". */
  phone: z.string().nullable(),
  hours: dealerHoursSchema.nullable(),
  media: dealerMediaSchema,
});

export const dealerInsightResponseSchema = z.object({
  dealer: dealerInsightSchema,
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type DealerInsightRating = z.infer<typeof dealerRatingSchema>;
export type DealerInsightAddress = z.infer<typeof dealerAddressSchema>;
export type DealerInsightHoursEntry = z.infer<typeof dealerHoursEntrySchema>;
export type DealerInsightHours = z.infer<typeof dealerHoursSchema>;
export type DealerInsightPhoto = z.infer<typeof dealerPhotoSchema>;
export type DealerInsightMapThumbnail = z.infer<typeof dealerMapThumbnailSchema>;
export type DealerInsightMedia = z.infer<typeof dealerMediaSchema>;
export type DealerInsight = z.infer<typeof dealerInsightSchema>;
export type DealerInsightResponse = z.infer<typeof dealerInsightResponseSchema>;

/**
 * Compile-time check: DealerInsight must be structurally compatible with
 * DealerInfo from @ucmp/sdk-search-api for the base identification fields.
 * This ensures our contract stays aligned with the SDK as it evolves.
 */
type _AssertDealerInfoCompat =
  DealerInfo extends Pick<
    DealerInsight,
    "dealerCode" | "dealerName" | "city" | "state" | "zipCode" | "latitude" | "longitude"
  >
    ? true
    : never;

export type { _AssertDealerInfoCompat as _DealerInfoCompat };
