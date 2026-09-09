import {
  booleanFilterTypeEnum,
  enumFilterTypeEnum,
  multiEnumFilterTypeEnum,
  rangeFilterTypeEnum,
} from "@ucmp/sdk-search-api";
import type {
  FilterColorGroup,
  FilterQuickPill,
  FilterSectionMockData,
} from "../../components/filters-dialog/filter-mock-data";
import type { SmartFilter } from "../contracts/filters-response.schema";

/**
 * Maps a BFF FilterKey to the UI section key used by FILTER_SECTIONS.
 *
 * Keys that collide (multiple BFF keys → same UI key) are intentionally
 * excluded to avoid last-one-wins overwriting. Those sections fall back
 * to component-level mock data via FilterContentPanel's per-section fallback.
 */
const BFF_KEY_TO_UI_KEY: Record<string, string> = {
  price: "price",
  year: "year",
  mileage: "mileage",
  fuelType: "fuel-type",
  drivetrain: "drivetrain",
  transmissionType: "transmission",
  exteriorColorFamily: "color",
  interiorColorFamily: "color",
  model: "model",
  features: "features",
  make: "make",
  trim: "trim",
  bodyStyle: "body-style",
};

/** Keys that should render as color swatches. */
const COLOR_KEYS = new Set(["exteriorColorFamily", "interiorColorFamily"]);

/** Labels for color groups. */
const COLOR_GROUP_LABELS: Record<string, string> = {
  exteriorColorFamily: "Exterior",
  interiorColorFamily: "Interior",
};

type FilterDataMap = Record<string, FilterSectionMockData>;

/** Default range placeholders keyed by filter key and position. */
const RANGE_DEFAULTS: Record<string, { min: string; max: string }> = {
  price: { min: "$0", max: "Any" },
  mileage: { min: "0 mi", max: "Any" },
  year: { min: "Any", max: "Newest" },
};

const FALLBACK_DEFAULTS = { min: "0", max: "Any" };

/** Range formatting configuration for unit conversion and display. */
const RANGE_FORMAT_CONFIG: Record<string, { threshold: number; format: (v: number) => string }> = {
  price: {
    threshold: 1000,
    format: (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${v}`),
  },
  mileage: {
    threshold: 1000,
    format: (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K mi` : `${v} mi`),
  },
};

/** Year filter configuration for UI display. */
const YEAR_FILTER_CONFIG = {
  key: "year",
  labels: { min: "From", max: "To" },
  rangeType: "select" as const,
};

/** Default UI labels for non-year range filters. */
const DEFAULT_RANGE_LABELS = { min: "Min", max: "Max" };
const DEFAULT_RANGE_TYPE = "input" as const;

/** Boolean filter configuration. */
const BOOLEAN_FILTER_VALUE = "true";

/**
 * Formats a numeric value for display in range fields.
 * Returns key-specific placeholder defaults when value is undefined.
 */
function formatRangeValue(key: string, value: number | undefined, position: "min" | "max"): string {
  if (value === undefined) {
    const defaults = RANGE_DEFAULTS[key] ?? FALLBACK_DEFAULTS;
    return defaults[position];
  }

  const config = RANGE_FORMAT_CONFIG[key];
  if (config) {
    return config.format(value);
  }

  return String(value);
}

/**
 * Maps a Range filter to the UI section data shape.
 */
function mapRangeFilter(filter: SmartFilter & { type: "Range" }): FilterSectionMockData {
  const isYear = filter.key === YEAR_FILTER_CONFIG.key;
  const labels = isYear ? YEAR_FILTER_CONFIG.labels : DEFAULT_RANGE_LABELS;
  const rangeType = isYear ? YEAR_FILTER_CONFIG.rangeType : DEFAULT_RANGE_TYPE;

  return {
    rangeFields: [
      { label: labels.min, value: formatRangeValue(filter.key, filter.min, "min") },
      { label: labels.max, value: formatRangeValue(filter.key, filter.max, "max") },
    ],
    rangeType,
  };
}

/**
 * Maps a MultiEnum filter to quick pills.
 */
function mapMultiEnumToPills(filter: SmartFilter & { type: "MultiEnum" }): FilterQuickPill[] {
  return filter.options.map((opt) => ({
    label: opt.label ?? String(opt.value),
    value: String(opt.value),
  }));
}

/**
 * Maps a MultiEnum color filter to a color group with hex metadata.
 * Guards against non-string hex values from the metadata record.
 */
function mapColorFilter(filter: SmartFilter & { type: "MultiEnum" }): FilterColorGroup {
  return {
    label: COLOR_GROUP_LABELS[filter.key] ?? filter.label,
    colors: filter.options.map((opt) => ({
      label: opt.label ?? String(opt.value),
      value: String(opt.value),
      hex: typeof opt.metadata?.hex === "string" ? opt.metadata.hex : undefined,
    })),
  };
}

/**
 * Maps an array of SmartFilter (from the BFF response) into the UI-level
 * FilterSectionMockData record keyed by UI section key.
 *
 * This is the bridge between the BFF contract and the dialog UI.
 * Sections not covered here fall back to component-level mock data via
 * FilterContentPanel's per-section fallback logic.
 */
export function mapFiltersToUI(filters: SmartFilter[]): FilterDataMap {
  const result: FilterDataMap = {};

  for (const filter of filters) {
    const uiKey = BFF_KEY_TO_UI_KEY[filter.key];
    if (!uiKey) {
      continue;
    }

    if (!result[uiKey]) {
      result[uiKey] = {};
    }

    // Delegate to specific mapper based on filter type
    mapFilterByType(filter, uiKey, result);
  }

  return result;
}

/**
 * Maps a filter to the result object based on its type.
 * Extracted to reduce cognitive complexity of mapFiltersToUI.
 */
function mapFilterByType(filter: SmartFilter, uiKey: string, result: FilterDataMap): void {
  const section = result[uiKey];
  if (!section) {
    return;
  }

  switch (filter.type) {
    case rangeFilterTypeEnum.Range: {
      const rangeData = mapRangeFilter(filter as SmartFilter & { type: "Range" });
      section.rangeFields = rangeData.rangeFields;
      section.rangeType = rangeData.rangeType;
      break;
    }

    case enumFilterTypeEnum.Enum: {
      section.quickFilters = (filter as SmartFilter & { type: "Enum" }).options.map((opt) => ({
        label: opt.label ?? String(opt.value),
        value: String(opt.value),
      }));
      break;
    }

    case booleanFilterTypeEnum.Boolean: {
      section.radioOptions = [{ label: filter.label, value: BOOLEAN_FILTER_VALUE }];
      break;
    }

    case multiEnumFilterTypeEnum.MultiEnum: {
      const multiEnumFilter = filter as SmartFilter & { type: "MultiEnum" };
      if (COLOR_KEYS.has(multiEnumFilter.key)) {
        const existing = section.colorGroups ?? [];
        existing.push(mapColorFilter(multiEnumFilter));
        section.colorGroups = existing;
      } else {
        // Model and features map to quickFilters
        section.quickFilters = mapMultiEnumToPills(multiEnumFilter);
      }
      break;
    }

    default: {
      console.warn(`Unknown filter type encountered: ${(filter as { type?: string }).type}`);
      break;
    }
  }
}
