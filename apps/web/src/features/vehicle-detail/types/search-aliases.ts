/**
 * Search alias/synonym schema for flexible feature and spec matching.
 *
 * Allows users to search for common consumer-facing terminology
 * and find the standardized feature/spec name in results.
 *
 * Example:
 *   User types "ACC" → finds "Adaptive Cruise Control"
 *   User types "backup cam" → finds "Rear View Camera"
 *   User types "cruise" → finds "Cruise control"
 */

export interface SearchAlias {
  /**
   * Array of accepted search terms (abbreviations, common names, alternatives).
   * These are indexed alongside primaryName for fuzzy matching.
   * Examples: "ACC", "Adaptive Cruise", "cruise control", "BSM", "Blind Spot"
   */
  acceptedTerms: string[];
  /** The primary/canonical feature or spec name to display in results. */
  primaryName: string;
}

export type SearchAliasMap = Map<string, SearchAlias>;

/**
 * Build a search alias map from an array of SearchAlias definitions.
 * Used internally to validate and organize aliases.
 *
 * @param aliases - Array of SearchAlias definitions
 * @returns Map keyed by primaryName for quick lookup
 */
export function buildSearchAliasMap(aliases: SearchAlias[]): SearchAliasMap {
  return new Map(aliases.map((alias) => [alias.primaryName, alias]));
}

/**
 * Flatten SearchAlias definitions into a Fuse-indexable corpus.
 *
 * Each item in the result includes the primary name and all accepted terms
 * concatenated into a searchable string field.
 *
 * @example
 * ```tsx
 * const aliases = [
 *   { primaryName: "Adaptive Cruise Control", acceptedTerms: ["ACC", "Adaptive Cruise"] }
 * ];
 * const corpus = flattenAliasesForSearch(aliases);
 * // Result: [{ primaryName: "Adaptive Cruise Control", searchText: "Adaptive Cruise Control ACC Adaptive Cruise" }]
 * ```
 */
export function flattenAliasesForSearch(
  aliases: SearchAlias[]
): Array<{ primaryName: string; searchText: string }> {
  return aliases.map((alias) => ({
    primaryName: alias.primaryName,
    searchText: [alias.primaryName, ...alias.acceptedTerms].join(" "),
  }));
}
