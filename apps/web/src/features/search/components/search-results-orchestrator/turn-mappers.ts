import type {
  AgentSearchTurn,
  AgentSearchTurnBeat,
  ComparisonCard,
  InventoryCard,
  OptionCard,
  OptionCardsResponse,
} from "../../lib/agent-search-turns-collection";
import { mapInventoryCardToInventoryCard } from "../../lib/card-mappers/map-inventory-card-to-inventory-card";
import { mapOptionCardToEditorialCard } from "../../lib/card-mappers/map-option-card-to-editorial-card";
import { mapOptionCardToModelCard } from "../../lib/card-mappers/map-option-card-to-model-card";
import { mapOptionCardToSpecCard } from "../../lib/card-mappers/map-option-card-to-spec-card";
import { mapOptionCardToTrimCard } from "../../lib/card-mappers/map-option-card-to-trim-card";
import { parseMetricValue } from "../../lib/parse-metric-value";
import type { SearchResultItem } from "../../types/search-results";
import { baseTurnToResultItems } from "./base-turn-mappers";
import { toCardBadgeIconName } from "./constants";

// ─── OptionCard renderer registry ────────────────────────────────────────────

type OptionLevel = OptionCardsResponse["optionLevel"];

interface OptionCardRenderer {
  map: (card: OptionCard) => unknown;
  type: SearchResultItem["type"];
}

const OPTION_CARD_RENDERERS: Record<OptionLevel, OptionCardRenderer | null> = {
  // Generic spec card for levels without a dedicated layout
  Category: { map: mapOptionCardToSpecCard, type: "spec" },
  Fallback: { map: mapOptionCardToEditorialCard, type: "editorial" },
  Model: { map: mapOptionCardToModelCard, type: "model" },
  Package: { map: mapOptionCardToSpecCard, type: "spec" },
  Segment: { map: mapOptionCardToSpecCard, type: "spec" },
  Trim: { map: mapOptionCardToTrimCard, type: "trim" },
};

// ─── Response → SearchResultItem[] ───────────────────────────────────────────

export function turnToResultItems(turn: AgentSearchTurn): SearchResultItem[] {
  // All backends (v1/v2) emit mapped cards with a per-card `type`
  // discriminator, so always take the mapped-card path first. The legacy switch
  // below stays as a fallback for static_mock fixtures that emit raw shapes.
  const mappedItems = baseTurnToResultItems(turn);
  if (mappedItems !== null) {
    return mappedItems;
  }

  if (turn.status !== "complete" || !turn.response) {
    return [];
  }

  const { response } = turn;

  switch (response.responseMode) {
    case "InventoryCards":
      return response.results.map((card: InventoryCard) => ({
        data: mapInventoryCardToInventoryCard(card),
        id: card.vin,
        type: "inventory" as const,
      }));

    case "ComparisonCards":
      return response.results.map((card: ComparisonCard) => ({
        data: {
          badgeIconName: toCardBadgeIconName(card.badgeIconName),
          badgeLabel: card.badgeLabel ?? card.highlights?.[0],
          description: card.description ?? card.subtitle ?? "",
          image: {
            alt: card.title,
            src: card.image ?? "",
          },
          metrics:
            card.metrics ??
            (card.attributes ?? [])
              .filter((a) => a.value !== undefined && a.key !== "year")
              .map((a) => {
                const { value, unit } = parseMetricValue(a.value as string);
                return { label: a.label, unit, value };
              }),
          title: card.title,
          year: card.year ?? (card.attributes ?? []).find((a) => a.key === "year")?.value,
        },
        id: card.id,
        nextSearchPlan: card.nextSearchPlan,
        type: "comparison" as const,
      }));

    case "OptionCards": {
      const renderer = OPTION_CARD_RENDERERS[response.optionLevel];
      if (!renderer) {
        return [];
      }
      return response.results.map((card: OptionCard) => ({
        data: renderer.map(card),
        id: card.id,
        nextSearchPlan: card.nextSearchPlan,
        type: renderer.type,
      })) as SearchResultItem[];
    }

    default:
      return [];
  }
}

export function getSeeAllHref(
  turn: AgentSearchTurn,
  results?: SearchResultItem[]
): string | undefined {
  if (turn.status !== "complete" || !turn.response) {
    return;
  }

  // "See All Results" is only meaningful when the turn contains inventory cards.
  // If results are provided (already mapped), check for at least one inventory card.
  if (results && !results.some((item) => item.type === "inventory")) {
    return;
  }

  // The base-mapped response also carries a top-level nextSearchPlan
  const rawResponse = turn.response as unknown as Record<string, unknown>;
  const plan =
    turn.response.nextSearchPlan ??
    (rawResponse.nextSearchPlan as { searchId?: string } | undefined);

  if (!plan?.searchId) {
    return;
  }

  // Filters are passed to the results page via an httpOnly cookie written by
  // storeSearchFilters — no URL params needed.
  return `/search/${plan.searchId}/results`;
}

/** The turn's shopper-facing progress checklist, in arrival order. */
export function getTurnBeats(turn: AgentSearchTurn): AgentSearchTurnBeat[] {
  return turn.beats ?? [];
}
