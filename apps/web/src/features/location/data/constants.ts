import { LOCATION_DEFAULTS } from "@ucmp/shared/constants";

/**
 * Default zip code used when no cookie value is present.
 * Re-exported from `@ucmp/shared/constants` so proxy.ts, server actions,
 * and this feature share one source of truth.
 */
export const DEFAULT_ZIP_CODE = LOCATION_DEFAULTS.ZIP;

/** React Query key for location display state (zip only). */
export const LOCATION_QUERY_KEY = ["location"] as const;
