/**
 * A single active filter pill — the UI representation of one applied filter.
 * Shared across server and client code; defined here (not in a component file)
 * so server components can reference it without crossing the client boundary.
 */
export interface ActiveFilter {
  key: string;
  label: string;
  /**
   * When set, this pill represents a "smart filter" chip that was fed into the
   * SRP as a regular filter. Removing it records a `smartFilter.removed`
   * activity (using this display name) instead of a plain `filter.removed`.
   */
  smartFilterName?: string;
  value: string;
}
