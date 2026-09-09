import type { OptionCard } from "../agent-search-turns-collection";

/**
 * Looks up a single attribute value from an OptionCard by key or label.
 * Returns undefined if the attribute is absent or has no value.
 */
export function getOptionCardAttribute(card: OptionCard, key: string): string | undefined {
  return card.attributes?.find((entry) => entry.key === key || entry.label === key)?.value;
}
