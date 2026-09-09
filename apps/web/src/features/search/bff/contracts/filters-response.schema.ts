import type {
  Filter,
  BooleanFilter as SdkBooleanFilter,
  EnumFilter as SdkEnumFilter,
  FilterKey as SdkFilterKey,
  FilterOption as SdkFilterOption,
  MultiEnumFilter as SdkMultiEnumFilter,
  RangeFilter as SdkRangeFilter,
  SmartFilter as SdkSmartFilter,
} from "@ucmp/sdk-search-api";
import {
  booleanFilterTypeEnum,
  dimensionIdEnum,
  enumFilterTypeEnum,
  multiEnumFilterTypeEnum,
  rangeFilterTypeEnum,
} from "@ucmp/sdk-search-api";
import { z } from "zod";

/** Runtime validation for filter keys — derived from SDK dimensionIdEnum. */
export const FilterKeySchema = z.enum([
  dimensionIdEnum.make,
  dimensionIdEnum.model,
  dimensionIdEnum.trim,
  dimensionIdEnum.bodyStyle,
  dimensionIdEnum.fuelType,
  dimensionIdEnum.drivetrain,
  dimensionIdEnum.transmissionType,
  dimensionIdEnum.exteriorColorFamily,
  dimensionIdEnum.interiorColorFamily,
  dimensionIdEnum.price,
  dimensionIdEnum.mileage,
  dimensionIdEnum.year,
  dimensionIdEnum.features,
  dimensionIdEnum.powertrainType,
  dimensionIdEnum.vehicleCategory,
  dimensionIdEnum.dealRating,
  dimensionIdEnum.seatingCapacity,
]);

export type FilterKey = SdkFilterKey;

const filterOptionSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]),
  label: z.string().optional(),
  count: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type FilterOption = SdkFilterOption;

const enumFilterSchema = z.object({
  key: FilterKeySchema,
  label: z.string(),
  type: z.literal(enumFilterTypeEnum.Enum),
  options: z.array(filterOptionSchema),
});

export type EnumFilter = SdkEnumFilter;

const multiEnumFilterSchema = z.object({
  key: FilterKeySchema,
  label: z.string(),
  type: z.literal(multiEnumFilterTypeEnum.MultiEnum),
  options: z.array(filterOptionSchema),
});

export type MultiEnumFilter = SdkMultiEnumFilter;

const rangeFilterSchema = z.object({
  key: FilterKeySchema,
  label: z.string(),
  type: z.literal(rangeFilterTypeEnum.Range),
  min: z.number().optional(),
  max: z.number().optional(),
});

export type RangeFilter = SdkRangeFilter;

const booleanFilterSchema = z.object({
  key: FilterKeySchema,
  label: z.string(),
  type: z.literal(booleanFilterTypeEnum.Boolean),
  count: z.number().int().nonnegative(),
});

export type BooleanFilter = SdkBooleanFilter;

export const smartFilterSchema = z.discriminatedUnion("type", [
  enumFilterSchema,
  multiEnumFilterSchema,
  rangeFilterSchema,
  booleanFilterSchema,
]);

export type SmartFilter = SdkSmartFilter;

export const selectedContextFilterSchema = z.object({
  key: FilterKeySchema,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  values: z.array(z.union([z.string(), z.number()])).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export type SelectedContextFilter = Filter;

// ─── Client-facing response ──────────────────────────────────────────────────

export interface FiltersResponse {
  data: {
    filters: SmartFilter[];
    selectedContextFilters?: SelectedContextFilter[];
  };
  meta: {
    traceId: string;
    timestamp: string;
  };
}

// ─── Upstream response (loose typing) ────────────────────────────────────────

export interface FiltersUpstreamResponse {
  data: {
    filters: Record<string, unknown>[];
    selectedContextFilters?: Record<string, unknown>[];
  };
  meta?: Record<string, unknown>;
}
