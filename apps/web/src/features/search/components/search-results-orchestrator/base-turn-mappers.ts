import type { AgentSearchTurn } from "../../lib/agent-search-turns-collection";
import type { BaseMappedCard } from "../../lib/base-agent-types";
import { isBaseMappedResults } from "../../lib/base-agent-types";
import { mapBaseCardToResultItem } from "../../lib/card-mappers/map-base-card-to-result-item";
import type { SearchResultItem } from "../../types/search-results";

/**
 * Base (shared v1/v2) turn → SearchResultItem[] mapper.
 *
 * The BFF transforms upstream cards into `MappedCard` objects stored in
 * `response.results`. Each card has a `type` discriminator ("spec", "pill",
 * "inventory") rather than the legacy V2 raw shape (InventoryCard, OptionCard,
 * etc.).
 *
 * This function detects base mapped cards by checking whether `results[0]`
 * has a `type` field. Returns `null` when the response uses legacy raw shapes
 * — callers should fall through to the legacy mapper.
 */
export function baseTurnToResultItems(turn: AgentSearchTurn): SearchResultItem[] | null {
  if (turn.status !== "complete" || !turn.response) {
    return null;
  }

  const response = turn.response as unknown as Record<string, unknown>;
  const results = response.results as unknown[];

  if (!Array.isArray(results) || results.length === 0) {
    // Empty results — could be a text-only response. Return empty array so
    // the orchestrator shows text without cards.
    if (Array.isArray(results)) {
      return [];
    }
    return null;
  }

  if (!isBaseMappedResults(results)) {
    // Not the base mapped shape — fall through to the legacy mapper
    return null;
  }

  return (results as BaseMappedCard[]).map(mapBaseCardToResultItem);
}
