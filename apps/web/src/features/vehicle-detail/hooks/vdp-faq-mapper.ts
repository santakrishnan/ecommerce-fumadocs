import type {
  AgentSearchResponse,
  AgentSearchTurn,
  AgentComparisonCard as ComparisonCard,
  AgentOptionCard as OptionCard,
} from "@features/search";

import type { VdpFaqCard, VdpSearchFaqApiResponse } from "../bff/contracts/vdp-search-faq.schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type OptionLevel = "Category" | "Segment" | "Model" | "Trim" | "Package" | "Fallback";

function resolveOptionLevel(level: string | undefined): OptionLevel {
  switch (level) {
    case "Category":
    case "Segment":
    case "Model":
    case "Trim":
    case "Package":
    case "Fallback":
      return level;
    default:
      return "Fallback";
  }
}

// ─── Card mapper ─────────────────────────────────────────────────────────────

/**
 * Maps a BFF `VdpFaqCard` into the shared card shape consumed by the
 * orchestrator. Both `OptionCard` and `ComparisonCard` share the same
 * required fields; this single mapper handles both.
 *
 * `isReadOnly` is intentionally not forwarded — read-only enforcement is
 * handled at the overlay level via the `readOnly` prop on
 * `SearchResultsOrchestratorWrapper`. If FAQ cards are ever rendered outside
 * a fully read-only overlay, revisit: either forward the flag or strip
 * `nextSearchPlan.filters` here when `card.isReadOnly` is true.
 */
export function mapVdpFaqCard(card: VdpFaqCard): OptionCard & Partial<ComparisonCard> {
  return {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    description: card.description,
    image: card.image,
    highlights: card.highlights,
    attributes: card.attributes,
    availableCount: card.availableCount,
    nextSearchPlan: {
      searchId: card.nextSearchPlan.searchId,
      filters: card.nextSearchPlan.filters,
    },
  };
}

// ─── Turn builders ────────────────────────────────────────────────────────────

export function buildCompletedTurn(
  turnId: string,
  searchId: string,
  query: string,
  response: AgentSearchResponse
): AgentSearchTurn {
  return {
    id: turnId,
    searchId,
    role: "user",
    query,
    status: "complete",
    submittedAt: Date.now(),
    searchMode: "Exploration",
    response,
  };
}

/**
 * Builds the `AgentSearchResponse` from the BFF `results` field.
 *
 * The `responseMode` discriminator drives which visual card layout the
 * orchestrator renders — we must return the correct variant.
 */
export function buildCardResponse(
  bff: VdpSearchFaqApiResponse,
  actions: Array<{ href: string; label: string }> | undefined
): AgentSearchResponse {
  const { responseMode, optionLevel, cards } = bff.data.results ?? { cards: [] };
  const mapped = cards.map(mapVdpFaqCard);
  const summary = bff.data.answer.summary;
  const totalCount = cards.length;

  if (responseMode === "ComparisonCards") {
    return {
      responseMode: "ComparisonCards",
      summary,
      totalCount,
      results: mapped as ComparisonCard[],
      actions,
      nextSearchPlan: { filters: [], searchId: "" },
    };
  }

  if (mapped.length > 0) {
    return {
      responseMode: "OptionCards",
      optionLevel: resolveOptionLevel(optionLevel),
      summary,
      totalCount,
      results: mapped as OptionCard[],
      actions,
      nextSearchPlan: { filters: [], searchId: "" },
    };
  }

  return {
    responseMode: "InventoryCards",
    summary,
    totalCount: 0,
    results: [],
    actions,
    nextSearchPlan: { filters: [], searchId: "" },
  };
}

/**
 * Maps a BFF FAQ response into a completed `AgentSearchTurn` ready for the
 * search orchestrator to render.
 */
export function mapBffToTurn(
  turnId: string,
  searchId: string,
  query: string,
  bff: VdpSearchFaqApiResponse
): AgentSearchTurn {
  const actions = bff.data.suggestedFollowUps?.map((q) => ({ label: q, href: "" }));
  return buildCompletedTurn(turnId, searchId, query, buildCardResponse(bff, actions));
}
