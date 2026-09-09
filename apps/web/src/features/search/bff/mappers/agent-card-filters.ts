/**
 * Shared helpers for reading values out of a card's `nextSearchPlan.filters`
 * array. Used by both the v1 and v2 card mappers.
 */

/** Extracts the model name from a card's nextSearchPlan filters array. */
export function extractModelFromFilters(filters: unknown[] | undefined): string | undefined {
  if (!filters) {
    return;
  }
  for (const f of filters) {
    const filter = f as Record<string, unknown>;
    if (filter.key === "model") {
      if (filter.value) {
        return String(filter.value);
      }
      if (Array.isArray(filter.values) && filter.values.length > 0) {
        return String(filter.values[0]);
      }
    }
  }
  return;
}
