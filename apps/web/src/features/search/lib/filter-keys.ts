export const RANGE_FILTER_KEY_GROUPS = {
  price: ["price", "priceMax"],
  mileage: ["mileage", "mileageMax"],
  year: ["year", "yearFrom"],
} as const satisfies Record<string, readonly string[]>;

export const RANGE_FILTER_KEYS = new Set<string>(Object.keys(RANGE_FILTER_KEY_GROUPS));

export function getRangeFilterKeys(filterKey: string): readonly string[] {
  return RANGE_FILTER_KEY_GROUPS[filterKey as keyof typeof RANGE_FILTER_KEY_GROUPS] ?? [filterKey];
}

export function matchesRangeFilterKey(filterKey: string, groupKey: string): boolean {
  return getRangeFilterKeys(groupKey).includes(filterKey);
}
