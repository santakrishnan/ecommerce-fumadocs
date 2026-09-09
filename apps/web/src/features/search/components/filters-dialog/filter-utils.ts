import { matchesRangeFilterKey } from "@features/search/lib/filter-keys";
import { parseNumericFilterValue } from "../../lib/parse-numeric-filter-value";
import type { SelectedFilter } from "./filter-content-panel";
import type { FilterRangeField } from "./filter-mock-data";

function getRangeFieldLabels(rangeFields: readonly FilterRangeField[]): {
  endLabel: string;
  startLabel: string;
} {
  const [startField, endField] = rangeFields;

  return {
    startLabel: startField?.label ?? "Min",
    endLabel: endField?.label ?? "Max",
  };
}

export function parseRangeNumber(value: string): number | null {
  return parseNumericFilterValue(value);
}

export function formatRangeValue(value: string, sectionKey: string): string {
  if (!value) {
    return "";
  }

  const num = parseRangeNumber(value);

  if (num === null) {
    return value;
  }

  if (sectionKey === "price") {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }

    return `$${num}`;
  }

  if (sectionKey === "mileage") {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }

    return String(num);
  }

  if (sectionKey === "year") {
    return String(Math.trunc(num));
  }

  return value;
}

export function formatCombinedRangeLabel(minDisplay: string, maxDisplay: string): string {
  if (minDisplay && maxDisplay) {
    return `${minDisplay}-${maxDisplay}`;
  }

  if (minDisplay) {
    return `${minDisplay}+`;
  }

  return `Up to ${maxDisplay}`;
}

export function getDefaultRangeValues(
  rangeFields?: readonly FilterRangeField[]
): Record<string, string> {
  return (
    rangeFields?.reduce(
      (acc, field) => {
        acc[field.label] = field.value;
        return acc;
      },
      {} as Record<string, string>
    ) ?? {}
  );
}

export function getRangeValuesFromActiveFilters(
  rangeFields: readonly FilterRangeField[] | undefined,
  sectionKey: string,
  selectedFilters: SelectedFilter[]
): Record<string, string> {
  const defaultValues = getDefaultRangeValues(rangeFields);

  if (!rangeFields) {
    return defaultValues;
  }

  const { endLabel, startLabel } = getRangeFieldLabels(rangeFields);

  const activeRangeFilter = selectedFilters.find((filter) =>
    matchesRangeFilterKey(filter.key, sectionKey)
  );

  if (!activeRangeFilter) {
    return defaultValues;
  }

  if (!activeRangeFilter.value.includes("-")) {
    if (sectionKey === "year") {
      return {
        ...defaultValues,
        [startLabel]: formatRangeValue(activeRangeFilter.value, sectionKey),
      };
    }

    return {
      ...defaultValues,
      [endLabel]: formatRangeValue(activeRangeFilter.value, sectionKey),
    };
  }

  const [minValue = "", maxValue = ""] = activeRangeFilter.value.split("-", 2);

  return {
    ...defaultValues,
    [startLabel]: minValue
      ? formatRangeValue(minValue, sectionKey)
      : (defaultValues[startLabel] ?? ""),
    [endLabel]: maxValue ? formatRangeValue(maxValue, sectionKey) : (defaultValues[endLabel] ?? ""),
  };
}
