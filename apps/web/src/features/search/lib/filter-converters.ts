import type { FilterChangeEntry } from "@features/profile/activities/client";
import type { EnumFilter, SmartFilter } from "@ucmp/sdk-search-api";
import {
  type FilterKey,
  FilterKeySchema,
  type SelectedContextFilter,
} from "../bff/contracts/filters-response.schema";
import type { ActiveFilter } from "../types/filters";
import { parseNumericFilterValue } from "./parse-numeric-filter-value";

// ─── SelectedContextFilter → SmartFilter ─────────────────────────────────────

function toSmartFilter(filter: SelectedContextFilter): SmartFilter | null {
  const keyParse = FilterKeySchema.safeParse(filter.key);

  if (!keyParse.success) {
    return null;
  }

  const key = keyParse.data;
  const label = key;

  // Range: has min or max (and no discrete values)
  if (
    (filter.min !== undefined || filter.max !== undefined) &&
    !filter.values?.length &&
    filter.value === undefined
  ) {
    const rangeFilter: {
      key: typeof key;
      label: string;
      type: "Range";
      min?: number;
      max?: number;
    } = { key, label, type: "Range" };
    if (filter.min !== undefined) {
      rangeFilter.min = filter.min;
    }
    if (filter.max !== undefined) {
      rangeFilter.max = filter.max;
    }
    return rangeFilter as SmartFilter;
  }

  // Boolean: explicit boolean value
  if (typeof filter.value === "boolean") {
    return { count: 0, key, label, type: "Boolean" } as SmartFilter;
  }

  // Enum / MultiEnum: has values[] or a string/number value
  const isMultiEnum = key === "features";
  const type = isMultiEnum ? "MultiEnum" : "Enum";

  let rawValues: Array<string | number>;
  if (filter.values?.length) {
    rawValues = filter.values;
  } else if (filter.value === undefined) {
    rawValues = [];
  } else {
    rawValues = [filter.value as string | number];
  }

  if (rawValues.length === 0) {
    return null;
  }

  return {
    key,
    label,
    options: rawValues.map((v) => ({ count: 0, value: String(v) })),
    type,
  } as SmartFilter;
}

/**
 * Converts `SelectedContextFilter[]` into `SmartFilter[]` for the search API.
 * Filters with unrecognised keys are silently dropped.
 */
export function contextFiltersToSmartFilters(filters: SelectedContextFilter[]): SmartFilter[] {
  const result: SmartFilter[] = [];
  const enumFiltersByKey = new Map<string, SmartFilter>();
  for (const filter of filters) {
    const mapped = toSmartFilter(filter);
    if (mapped === null) {
      continue;
    }
    if (mapped.type === "Enum" || mapped.type === "MultiEnum") {
      const existing = enumFiltersByKey.get(mapped.key);
      if (existing) {
        for (const option of mapped.options ?? []) {
          (existing as EnumFilter).options?.push(option);
        }
      } else {
        enumFiltersByKey.set(mapped.key, mapped);
        result.push(mapped);
      }
    } else {
      result.push(mapped);
    }
  }
  return result;
}

// ─── SelectedContextFilter → ActiveFilter ────────────────────────────────────

/**
 * The subset of FilterKey values our application validates and displays.
 * Derived from FilterKeySchema so it stays in sync as we extend the schema.
 * Narrower than the full SDK FilterKey union, which may include keys our
 * UI doesn't use (e.g. "vin").
 */
type AppFilterKey = (typeof FilterKeySchema.enum)[keyof typeof FilterKeySchema.enum];

const FILTER_KEY_LABELS: Record<AppFilterKey, string> = {
  bodyStyle: "Body Style",
  dealRating: "Deal Rating",
  drivetrain: "Drivetrain",
  exteriorColorFamily: "Exterior Color",
  features: "Features",
  fuelType: "Fuel Type",
  interiorColorFamily: "Interior Color",
  make: "Make",
  mileage: "Mileage",
  model: "Model",
  powertrainType: "Powertrain",
  price: "Price",
  seatingCapacity: "Seating Capacity",
  transmissionType: "Transmission",
  trim: "Trim",
  vehicleCategory: "Category",
  year: "Year",
};

function formatPrice(value: number): string {
  return value >= 1000 ? `$${Math.round(value / 1000)}K` : `$${value}`;
}

function formatMileage(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}K mi` : `${value} mi`;
}

function formatRangeValue(key: AppFilterKey, value: number): string {
  if (key === "price") {
    return formatPrice(value);
  }
  if (key === "mileage") {
    return formatMileage(value);
  }
  return String(value);
}

function formatRangeLabel(key: AppFilterKey, min?: number, max?: number): string {
  const label = FILTER_KEY_LABELS[key] ?? key;
  const fmtMin = min === undefined ? "" : formatRangeValue(key, min);
  const fmtMax = max === undefined ? "" : formatRangeValue(key, max);
  if (fmtMin && fmtMax) {
    return `${label}: ${fmtMin}–${fmtMax}`;
  }
  return fmtMin ? `${label}: ${fmtMin}+` : `${label}: up to ${fmtMax}`;
}

/**
 * Maps BFF filter keys to the UI-level ActiveFilter key used by the dialog.
 * Keys not listed here pass through as-is.
 */
const BFF_KEY_TO_ACTIVE_KEY: Record<string, string> = {
  exteriorColorFamily: "ext-color",
  interiorColorFamily: "int-color",
  fuelType: "fuel-type",
  transmissionType: "transmission",
};

/**
 * Converts `SelectedContextFilter[]` into `ActiveFilter[]` pill shape for
 * the filter dialog and headline count.
 *
 * Enum/MultiEnum filters produce one pill per value.
 * Range filters produce a single pill with a human-readable formatted label
 * (e.g. "Price: $20K–$50K", "Mileage: up to 30K mi").
 */
export function contextFiltersToActiveFilters(filters: SelectedContextFilter[]): ActiveFilter[] {
  const result: ActiveFilter[] = [];
  for (const filter of filters) {
    const activeKey = BFF_KEY_TO_ACTIVE_KEY[filter.key] ?? filter.key;
    if (filter.values && filter.values.length > 0) {
      for (const value of filter.values) {
        result.push({ key: activeKey, label: String(value), value: String(value) });
      }
      continue;
    }
    if (filter.value !== undefined) {
      result.push({ key: activeKey, label: String(filter.value), value: String(filter.value) });
      continue;
    }
    if (filter.min !== undefined || filter.max !== undefined) {
      result.push({
        key: activeKey,
        label: formatRangeLabel(filter.key as AppFilterKey, filter.min, filter.max),
        value: `${filter.min ?? ""}-${filter.max ?? ""}`,
      });
    }
  }
  return result;
}

// ─── ActiveFilter → SmartFilter ──────────────────────────────────────────────

const ACTIVE_TO_SMART_KEY_MAP = {
  model: "model",
  make: "make",
  trim: "trim",
  bodyStyle: "bodyStyle",
  "ext-color": "exteriorColorFamily",
  "int-color": "interiorColorFamily",
  drivetrain: "drivetrain",
  features: "features",
  "fuel-type": "fuelType",
  mileage: "mileage",
  powertrainType: "powertrainType",
  price: "price",
  seatingCapacity: "seatingCapacity",
  transmission: "transmissionType",
  vehicleCategory: "vehicleCategory",
  year: "year",
  dealRating: "dealRating",
} as const satisfies Record<string, FilterKey>;

function parseRangeValue(value: string): { min?: number; max?: number } {
  if (!value.includes("-")) {
    return {};
  }
  const [minValue = "", maxValue = ""] = value.split("-", 2);
  const min = parseNumericFilterValue(minValue);
  const max = parseNumericFilterValue(maxValue);
  return {
    ...(min !== null && { min }),
    ...(max !== null && { max }),
  };
}

function buildRangeFilter(
  key: SmartFilter["key"],
  label: string,
  range: { min?: number; max?: number },
  fallback: { min?: number; max?: number }
): SmartFilter {
  return { key, label, type: "Range", ...range, ...fallback };
}

function buildEnumFilter(key: SmartFilter["key"], label: string, value: string): SmartFilter {
  return {
    key,
    label,
    options: [{ count: 1, label, value }],
    type: key === "features" ? "MultiEnum" : "Enum",
  };
}

function buildBooleanFilter(key: SmartFilter["key"], label: string): SmartFilter {
  return { count: 0, key, label, type: "Boolean" };
}

/**
 * Converts `ActiveFilter[]` (from the filter dialog UI) into `SmartFilter[]`
 * for the search API request.
 *
 * Keys not in the key map are silently dropped — they are display-only or
 * already handled server-side by the active search session context.
 */
export function activeFiltersToSmartFilters(filters: ActiveFilter[]): SmartFilter[] {
  const mappedFilters: SmartFilter[] = [];
  const enumFiltersByKey = new Map<string, SmartFilter>();
  for (const filter of filters) {
    const mappedKey: SmartFilter["key"] | undefined =
      ACTIVE_TO_SMART_KEY_MAP[filter.key as keyof typeof ACTIVE_TO_SMART_KEY_MAP];
    if (!mappedKey) {
      continue;
    }
    if (mappedKey === "price" || mappedKey === "mileage" || mappedKey === "year") {
      const range = parseRangeValue(filter.value);
      const singleValue = parseNumericFilterValue(filter.value);
      const hasExplicitRange = Object.keys(range).length > 0;
      if (mappedKey === "year") {
        mappedFilters.push(
          buildRangeFilter(mappedKey, filter.label, range, {
            ...(!hasExplicitRange && singleValue !== null && { min: singleValue }),
          })
        );
        continue;
      }
      mappedFilters.push(
        buildRangeFilter(mappedKey, filter.label, range, {
          ...(!hasExplicitRange && singleValue !== null && { max: singleValue }),
        })
      );
      continue;
    }
    if (mappedKey === "dealRating") {
      mappedFilters.push(buildBooleanFilter(mappedKey, filter.label));
      continue;
    }
    const existing = enumFiltersByKey.get(mappedKey);
    if (existing) {
      (existing as EnumFilter).options?.push({
        count: 1,
        label: filter.label,
        value: filter.value,
      });
    } else {
      const newFilter = buildEnumFilter(mappedKey, filter.label, filter.value);
      enumFiltersByKey.set(mappedKey, newFilter);
      mappedFilters.push(newFilter);
    }
  }
  return mappedFilters;
}

// ─── ActiveFilter → FilterChangeEntry (local activity DTO) ───────────────────

/**
 * Converts a single `ActiveFilter` pill into the local `FilterChangeEntry` DTO
 * consumed by the profile-activities Server Actions (`filter.added` /
 * `filter.removed` / `smartFilter.removed`). The DTO is deliberately decoupled
 * from the generated visitor-profile SDK — translation to the SDK `FilterEntry`
 * contract happens inside the activities BFF, not here in the search layer.
 *
 * Returns null when the pill's key does not map to a known dimension — such
 * pills are display-only and are not recorded.
 */
export function activeFilterToFilterEntry(filter: ActiveFilter): FilterChangeEntry | null {
  const mappedKey: FilterChangeEntry["key"] | undefined =
    ACTIVE_TO_SMART_KEY_MAP[filter.key as keyof typeof ACTIVE_TO_SMART_KEY_MAP];
  if (!mappedKey) {
    return null;
  }

  if (mappedKey === "price" || mappedKey === "mileage" || mappedKey === "year") {
    const range = parseRangeValue(filter.value);
    const singleValue = parseNumericFilterValue(filter.value);
    const hasExplicitRange = Object.keys(range).length > 0;
    const fallback =
      mappedKey === "year"
        ? { ...(!hasExplicitRange && singleValue !== null && { min: singleValue }) }
        : { ...(!hasExplicitRange && singleValue !== null && { max: singleValue }) };
    return { key: mappedKey, filterType: "Range", ...range, ...fallback };
  }

  if (mappedKey === "dealRating") {
    return { key: mappedKey, filterType: "Boolean", enabled: true };
  }

  if (mappedKey === "features") {
    return { key: mappedKey, filterType: "MultiEnum", values: [filter.value] };
  }

  return { key: mappedKey, filterType: "Enum", value: filter.value };
}

/**
 * Converts an `ActiveFilter[]` into `FilterChangeEntry[]` (one entry per pill),
 * dropping pills whose key does not map to a known dimension. Used to report
 * the full active filter set on each recorded filter-change event.
 */
export function activeFiltersToFilterEntries(filters: ActiveFilter[]): FilterChangeEntry[] {
  const entries: FilterChangeEntry[] = [];
  for (const filter of filters) {
    const entry = activeFilterToFilterEntry(filter);
    if (entry) {
      entries.push(entry);
    }
  }
  return entries;
}
