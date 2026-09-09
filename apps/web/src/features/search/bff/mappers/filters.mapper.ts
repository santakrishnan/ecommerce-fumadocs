import type {
  FiltersResponse,
  FiltersUpstreamResponse,
  SelectedContextFilter,
  SmartFilter,
} from "../contracts/filters-response.schema";
import {
  selectedContextFilterSchema,
  smartFilterSchema,
} from "../contracts/filters-response.schema";

/** Validates and maps upstream filters, dropping malformed entries. */
export function mapFiltersUpstreamToResponse(upstream: FiltersUpstreamResponse): FiltersResponse {
  const filters = upstream.data.filters.reduce<SmartFilter[]>((acc, raw) => {
    const result = smartFilterSchema.safeParse(raw);
    if (result.success) {
      acc.push(result.data as SmartFilter);
    }
    return acc;
  }, []);

  const rawContextFilters = upstream.data.selectedContextFilters ?? [];
  const contextFilters = rawContextFilters.reduce<SelectedContextFilter[]>((acc, raw) => {
    const result = selectedContextFilterSchema.safeParse(raw);
    if (result.success) {
      acc.push(result.data as SelectedContextFilter);
    }
    return acc;
  }, []);

  return {
    data: {
      filters,
      ...(contextFilters.length > 0 ? { selectedContextFilters: contextFilters } : {}),
    },
    meta: {
      traceId: typeof upstream.meta?.traceId === "string" ? upstream.meta.traceId : "",
      timestamp:
        typeof upstream.meta?.timestamp === "string"
          ? upstream.meta.timestamp
          : new Date().toISOString(),
    },
  };
}
