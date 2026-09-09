import type {
  BaseCardItem,
  BaseCompletePayload,
  BaseFilter,
} from "../contracts/agent-upstream.schema";
import {
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

/**
 * Maps a v1 "option" card to a spec card.
 *
 * The `scope_gateway` theme maps to a distinct nudge card (guided-nudge
 * recovery). Otherwise, when the upstream supplies structured `attributes`
 * (same shape as v2/base), they are passed through directly; falls back to legacy
 * `highlights` strings stubbed as value-only spec rows for older upstreams.
 */
function mapV1OptionCard(card: BaseCardItem, nextSearchPlan: Record<string, unknown>): MappedCard {
  if (isScopeGatewayCard(card)) {
    return mapScopeGatewayCard(card, nextSearchPlan);
  }

  const data = (card.data ?? {}) as Record<string, unknown>;

  // Prefer structured attributes (matches v2/base passthrough); fall back to highlights.
  let specs: unknown[];
  if (Array.isArray(data.attributes) && data.attributes.length > 0) {
    specs = normalizeSpecs(data.attributes);
  } else {
    const highlights = Array.isArray(data.highlights) ? data.highlights : [];
    specs = highlights.map((value) => ({ key: "", label: "", value: String(value) }));
  }

  const filters = (card.nextSearchPlan as Record<string, unknown> | undefined)?.filters as
    | unknown[]
    | undefined;
  const modelFromFilters = extractModelFromFilters(filters);

  return {
    availableCount: (data.availableCount as number | undefined) ?? undefined,
    data: { show: 4, specs },
    id: card.id,
    image: resolveCardImage({
      apiImage: (data.thumbnailUrl as string) ?? undefined,
      bodyType: [modelFromFilters, data.title as string].filter(Boolean).join(" "),
      model: modelFromFilters ?? undefined,
      trim: (data.title as string) ?? undefined,
    }),
    nextSearchPlan,
    subtitle: (data.advisoryNote ?? data.subtitle) as string | undefined,
    title: (data.title as string) ?? card.id,
    type: "spec",
  };
}

/**
 * v1 card mapper. Only "option" cards differ from v2/base (highlight stubs); every
 * other card type delegates to the shared base mapper so inventory, comparison,
 * and concept cards stay in lockstep. v1 carries no debug context.
 */
const mapV1Card: CardMapper = (card, responseMode, debug) => {
  if (card.cardType === "option") {
    const nextSearchPlan = { ...((card.nextSearchPlan ?? {}) as Record<string, unknown>) };
    return mapV1OptionCard(card, nextSearchPlan);
  }
  return mapBaseCard(card, responseMode, debug);
};

/**
 * Overrides the response-level `filters` with v1's active selection.
 *
 * The shared transform derives response-level filters from `smartFilters`,
 * which v1 never sends — so it produces an empty set and a typed follow-up
 * query would drop the accumulated filters. v1 instead carries its active
 * selection in `payload.filters`; source both the top-level and
 * `response.nextSearchPlan` filters from there so continuity survives.
 */
function applyActiveFilters(
  result: Record<string, unknown>,
  activeFilters: BaseFilter[] | undefined
): Record<string, unknown> {
  if (!Array.isArray(activeFilters)) {
    return result;
  }
  const payload = result.payload as Record<string, unknown>;
  const response = payload.response as Record<string, unknown>;
  const nextSearchPlan = response.nextSearchPlan as Record<string, unknown>;

  return {
    ...result,
    payload: {
      ...payload,
      filters: activeFilters,
      response: {
        ...response,
        nextSearchPlan: { ...nextSearchPlan, filters: activeFilters },
      },
    },
  };
}

/**
 * Transforms a v1 Complete payload into the frontend shape. Same as the v2
 * transform apart from the option-card mapper, plus sourcing response-level
 * filters from `payload.filters` (v1 sends no `smartFilters`).
 */
export function transformV1CompletePayload(
  payload: BaseCompletePayload,
  runtimeSessionId: string,
  visitorId: string | null
): Record<string, unknown> {
  const result = transformBaseCompletePayload(payload, runtimeSessionId, visitorId, mapV1Card);
  return applyActiveFilters(result, payload.filters);
}
