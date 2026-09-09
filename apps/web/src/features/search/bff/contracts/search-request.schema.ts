import {
  type Location,
  locationOverrideSourceEnum,
  locationSlotTypeEnum,
  type LocationOverrideRequest as SdkLocationOverrideRequest,
  type SearchRequest as SdkSearchRequest,
  sortOrderEnum,
} from "@ucmp/sdk-search-api";
import { z } from "zod";
import { smartFilterSchema } from "./filters-response.schema";

export type { Location as SearchLocation } from "@ucmp/sdk-search-api";

/**
 * Location schema — required. Route handler resolves from cookies/geo
 * before validation so clients are never forced to supply it themselves.
 *
 * Matches SDK Location shape.
 */
const searchLocationSchema = z.object({
  zipCode: z.string().max(10),
  city: z.string().max(100).optional(),
  state: z
    .string()
    .max(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
  country: z
    .string()
    .max(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Search radius in miles; defaults to 100 upstream when omitted. */
  radiusMiles: z.number().int().min(1).optional(),
}) satisfies z.ZodType<Location>;

const searchPaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * LocationOverrideRequest — partial location intent echoed from a prior
 * Complete response. Search geocodes; agent never supplies lat/lng.
 */
const locationOverrideSchema = z.object({
  rawText: z.string().optional(),
  type: z
    .enum([
      locationSlotTypeEnum.zip,
      locationSlotTypeEnum.city,
      locationSlotTypeEnum.state,
      locationSlotTypeEnum.neighborhood,
      locationSlotTypeEnum.landmark,
      locationSlotTypeEnum.dealerName,
      locationSlotTypeEnum.nationwide,
    ])
    .optional(),
  radiusMiles: z.number().int().min(1).optional(),
  source: z
    .enum([
      locationOverrideSourceEnum.utterance,
      locationOverrideSourceEnum.clarificationChoice,
      locationOverrideSourceEnum.client,
      locationOverrideSourceEnum.sessionCarry,
    ])
    .optional(),
  candidateId: z.string().optional(),
});

/**
 * Validated request schema for POST /api/v1/search.
 *
 * `location` is required — the route handler injects it from cookies/geo
 * before calling safeParse so clients can omit it.
 */
export const searchRequestSchema = z.object({
  searchId: z.uuid().optional(),
  query: z.string().max(500).optional(),
  /** Typed SmartFilters (SDK dimension keys + type discriminator). */
  filters: z.array(smartFilterSchema).optional(),
  /** Visitor location context — required (injected server-side). */
  location: searchLocationSchema,
  /** Partial location override intent from the client. */
  locationOverride: locationOverrideSchema.optional(),
  /** Sort order for results. Defaults to "Recommended". */
  sort: z
    .enum([
      sortOrderEnum.Recommended,
      sortOrderEnum.LowestPrice,
      sortOrderEnum.HighestPrice,
      sortOrderEnum.LowestMileage,
      sortOrderEnum.NewestYear,
    ])
    .default(sortOrderEnum.Recommended),
  /** Pagination parameters. Defaults to limit 20, offset 0. */
  pagination: searchPaginationSchema.optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchPagination = z.infer<typeof searchPaginationSchema>;

// ─── Compile-time type assertion ─────────────────────────────────────────────
// If the SDK's SearchRequest changes a field type on any of the overlapping
// keys below, this check resolves to `never` and tsc will fail — surfacing
// schema drift as a build error instead of a silent runtime divergence.
//
// Excluded from the check:
//   `filters` — intentional divergence (BFF uses SmartFilter[], SDK uses Filter[]).
//   `locationOverride` — BFF extension; not yet a field on SDK SearchRequest.
type _AssertSdkAlignment =
  Pick<SearchRequest, "searchId" | "query" | "sort" | "pagination" | "location"> extends Pick<
    SdkSearchRequest,
    "searchId" | "query" | "sort" | "pagination" | "location"
  >
    ? true
    : never;

type _AssertLocationOverride =
  NonNullable<SearchRequest["locationOverride"]> extends SdkLocationOverrideRequest ? true : never;

export type { _AssertLocationOverride, _AssertSdkAlignment };
