import type { BaseCardItem, BaseCompletePayload } from "../contracts/agent-upstream.schema";
import {
  type BaseDebugContext,
  type CardMapper,
  isScopeGatewayCard,
  type MappedCard,
  mapBaseCard,
  mapScopeGatewayCard,
  transformBaseCompletePayload,
} from "./agent-card.mapper";
import { extractModelFromFilters } from "./agent-card-filters";
import { resolveCardImage } from "./agent-card-image-resolver";
import { normalizeSpecs } from "./agent-card-spec.mapper";

// ---------------------------------------------------------------------------
// V2 Card Mapping
// ---------------------------------------------------------------------------

/**
 * Maps an "option" card item for the v2 (Arrow) backend.
 *
 * v2 keys the split off the card's `data.theme` rather than the per-card
 * responseMode used by the base mapper:
 *   - theme "scope_gateway"      → nudge (guided-nudge recovery card)
 *   - theme starting with "axis_" → pill (exploration axis)
 *   - everything else            → spec
 */
function mapV2OptionCard(card: BaseCardItem, nextSearchPlan: Record<string, unknown>): MappedCard {
  if (isScopeGatewayCard(card)) {
    return mapScopeGatewayCard(card, nextSearchPlan);
  }

  const data = (card.data ?? {}) as Record<string, unknown>;

  if ((data.theme as string | undefined)?.startsWith("axis_")) {
    return {
      id: card.id,
      type: "pill",
      title: (data.title as string) ?? card.id,
      nextSearchPlan,
    };
  }

  const filters = (card.nextSearchPlan as Record<string, unknown>)?.filters as
    | unknown[]
    | undefined;
  const modelFromFilters = extractModelFromFilters(filters);

  return {
    availableCount: (data.availableCount as number | undefined) ?? undefined,
    id: card.id,
    type: "spec",
    title: (data.title as string) ?? card.id,
    subtitle: (data.advisoryNote ?? data.subtitle) as string | undefined,
    image: resolveCardImage({
      apiImage: (data.thumbnailUrl as string) ?? undefined,
      model: modelFromFilters ?? undefined,
      trim: (data.title as string) ?? undefined,
      bodyType: [modelFromFilters, data.title as string].filter(Boolean).join(" "),
    }),
    nextSearchPlan,
    data: { specs: normalizeSpecs((data.attributes as unknown[]) ?? []), show: 4 },
  };
}

/**
 * Maps a single v2 card item. Only the "option" card differs from the base
 * mapper — every other card type delegates to the shared base mapper so the
 * two backends stay in lockstep for inventory, comparison, and concept cards.
 *
 * v2 does not carry debug context, so nextSearchPlan is built without it.
 */
const mapV2Card: CardMapper = (
  card: BaseCardItem,
  responseMode: string | undefined,
  debug: BaseDebugContext
): MappedCard => {
  if (card.cardType === "option") {
    // Build nextSearchPlan without debug — v2 does not carry trace context.
    const nextSearchPlan = { ...((card.nextSearchPlan ?? {}) as Record<string, unknown>) };
    return mapV2OptionCard(card, nextSearchPlan);
  }
  return mapBaseCard(card, responseMode, debug);
};

// ---------------------------------------------------------------------------
// Complete Event Transformer
// ---------------------------------------------------------------------------

/**
 * Transforms a v2 Complete payload into the frontend shape.
 *
 * Identical to {@link transformBaseCompletePayload} apart from the card mapper,
 * which routes option cards through v2's theme-based pill/spec split and
 * omits debug context from their nextSearchPlan.
 */
export function transformV2CompletePayload(
  payload: BaseCompletePayload,
  runtimeSessionId: string,
  visitorId: string | null
): Record<string, unknown> {
  return transformBaseCompletePayload(payload, runtimeSessionId, visitorId, mapV2Card);
}
