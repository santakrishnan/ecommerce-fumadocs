import type { VehicleFeatures } from "@ucmp/sdk-search-api";
import { slugify } from "utils";
import type { Category, CategoryItem } from "../../types/categorized-modal";

const NEWLINE_SPLIT_REGEX = /[\n,]+/;

/**
 * Maps SDK VehicleFeatures.byCategory into the UI Category[] shape
 * used by the categorized detail modal.
 */
export function mapVehicleFeaturesToCategories(features: VehicleFeatures): Category[] {
  if (!features.byCategory || features.byCategory.length === 0) {
    return [];
  }

  return features.byCategory.map((entry) => ({
    id: slugify(entry.category),
    items: entry.items.map<CategoryItem>((item) => ({ label: item.name })),
    title: entry.label,
  }));
}

/**
 * Returns a flat list of all feature names from byCategory items.
 * Falls back to splitting features.text by newlines/commas if byCategory
 * is empty or absent.
 */
export function mapVehicleFeaturesToKeyList(features: VehicleFeatures): string[] {
  if (features.byCategory && features.byCategory.length > 0) {
    return features.byCategory.flatMap((entry) => entry.items.map((item) => item.name));
  }

  if (features.text && features.text.trim().length > 0) {
    return features.text
      .split(NEWLINE_SPLIT_REGEX)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [];
}
