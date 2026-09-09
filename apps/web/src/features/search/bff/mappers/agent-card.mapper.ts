import type { BaseCardItem, BaseCompletePayload } from "../contracts/agent-upstream.schema";
import { BaseCardItemSchema } from "../contracts/agent-upstream.schema";
import { extractModelFromFilters } from "./agent-card-filters";
import { resolveCardImage } from "./agent-card-image-resolver";
import { normalizeSpecs } from "./agent-card-spec.mapper";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts the first model value from a smartFilters array (response-level context). */
function extractModelFromSmartFilters(
  turnContext: Record<string, unknown> | undefined
): string | undefined {
  const smartFiltersRaw = turnContext?.smartFilters as unknown[] | undefined;
  if (!Array.isArray(smartFiltersRaw)) {
    return;
  }
  for (const f of smartFiltersRaw) {
    const filter = f as Record<string, unknown>;
    if (filter.key === "model" && Array.isArray(filter.options)) {
      const firstOpt = filter.options[0] as Record<string, unknown> | undefined;
      if (firstOpt?.value) {
        return String(firstOpt.value);
      }
    }
  }
  return;
}

// ---------------------------------------------------------------------------
// Debug Context
// ---------------------------------------------------------------------------

export interface BaseDebugContext {
  invokeMode: "aws";
  runtimeSessionId: string;
  stream: true;
  turnContext?: Record<string, unknown>;
  visitorId: string | null;
}

// ---------------------------------------------------------------------------
// Mapped Frontend Card Types
// ---------------------------------------------------------------------------

export interface MappedSpecCard {
  availableCount?: number;
  data: { specs: unknown[]; show: number };
  id: string | undefined;
  image: string | undefined;
  nextSearchPlan: Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "spec";
}

export interface MappedPillCard {
  id: string | undefined;
  nextSearchPlan: Record<string, unknown>;
  title: string | undefined;
  type: "pill";
}

export interface MappedInventoryCard {
  data: { vehicle: Record<string, unknown> };
  id: string | undefined;
  image: string | undefined;
  nextSearchPlan: Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "inventory";
}

export interface MappedNudgeCard {
  id: string | undefined;
  nextSearchPlan: Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "nudge";
}

export type MappedCard = MappedSpecCard | MappedPillCard | MappedInventoryCard | MappedNudgeCard;

const SCOPE_GATEWAY_THEME = "scope_gateway";

export function isScopeGatewayCard(card: BaseCardItem): boolean {
  const data = (card.data ?? {}) as Record<string, unknown>;
  return data.theme === SCOPE_GATEWAY_THEME;
}

/**
 * Maps a "scope_gateway" option card — the guided-nudge recovery card the agent
 * surfaces when a search returns nothing, offering a broadened next search.
 *
 * Rendered distinctly (`type: "nudge"`) so the UI can target it; for now it
 * reuses the large card presentation pending design follow-up.
 */
export function mapScopeGatewayCard(
  card: BaseCardItem,
  nextSearchPlan: Record<string, unknown>
): MappedNudgeCard {
  const data = (card.data ?? {}) as Record<string, unknown>;
  return {
    id: card.id,
    nextSearchPlan,
    subtitle: data.subtitle as string | undefined,
    title: (data.title as string) ?? card.id,
    type: "nudge",
  };
}

// ---------------------------------------------------------------------------
// Card Mapping
// ---------------------------------------------------------------------------

/**
 * Strategy for mapping a single card item. Injected into the transform so
 * backend variants (v1/v2) can override card mapping while sharing the rest
 * of the Complete-payload pipeline (turnContext, debug, filters).
 */
export type CardMapper = (
  card: BaseCardItem,
  responseMode: string | undefined,
  debug: BaseDebugContext
) => MappedCard;

function buildNextSearchPlan(card: BaseCardItem, debug: BaseDebugContext): Record<string, unknown> {
  return { ...((card.nextSearchPlan ?? {}) as Record<string, unknown>), debug };
}

/**
 * Maps an "option" card item — nudge, pill, or spec depending on theme and responseMode.
 *
 * Safe default only: both v1 (`mapV1Card`) and v2 (`mapV2Card`) fully override
 * "option" card handling with their own theme/responseMode splits and never
 * delegate here — each backend's option-card shape differs enough (v1's
 * highlights fallback, v2's `axis_`-prefixed pill theme) that neither reuses
 * this branch. It is kept so `mapBaseCard`'s default `CardMapper` behavior
 * (see `transformBaseCompletePayload`'s `mapCard` default parameter) stays
 * correct for any future backend that doesn't need a custom option-card split,
 * and so direct unit tests against `mapBaseCard` (e.g. scope_gateway coverage)
 * keep working without a version-specific mapper in the loop.
 */
function mapOptionCard(card: BaseCardItem, nextSearchPlan: Record<string, unknown>): MappedCard {
  if (isScopeGatewayCard(card)) {
    return mapScopeGatewayCard(card, nextSearchPlan);
  }

  const data = (card.data ?? {}) as Record<string, unknown>;
  const cardResponseMode = (card.nextSearchPlan as Record<string, unknown> | undefined)
    ?.responseMode as string | undefined;

  if (cardResponseMode === "OptionCards") {
    const filters = (card.nextSearchPlan as Record<string, unknown>)?.filters as
      | unknown[]
      | undefined;
    const modelFromFilters = extractModelFromFilters(filters);

    return {
      availableCount: (data.availableCount as number | undefined) ?? undefined,
      data: { show: 4, specs: normalizeSpecs((data.attributes as unknown[]) ?? []) },
      id: card.id,
      image: resolveCardImage({
        apiImage: (data.thumbnailUrl as string) ?? undefined,
        bodyType: [modelFromFilters, data.title as string].filter(Boolean).join(" "),
        model: modelFromFilters ?? undefined,
        trim: (data.title as string) ?? undefined,
      }),
      nextSearchPlan,
      subtitle: data.subtitle as string | undefined,
      title: (data.title as string) ?? card.id,
      type: "spec",
    };
  }
  // InventoryCards or no responseMode → pill
  return {
    id: card.id,
    nextSearchPlan,
    title: (data.title as string) ?? card.id,
    type: "pill",
  };
}

/**
 * Maps a single upstream card item to a frontend card type.
 *
 * Mapping rules (based on cardType + card.nextSearchPlan.responseMode):
 *   - concept,    OptionCards    → spec
 *   - option,     OptionCards    → spec
 *   - option,     InventoryCards → pill
 *   - option,     (none)        → pill
 *   - inventory,  InventoryCards → inventory
 *   - comparison, InventoryCards → spec
 *   - option, theme scope_gateway → nudge
 *
 * Debug context is baked into each card's nextSearchPlan for traceability.
 * Unknown card types are mapped to pill cards as a safe fallback.
 */
export function mapBaseCard(
  card: BaseCardItem,
  _responseMode: string | undefined,
  debug: BaseDebugContext
): MappedCard {
  const nextSearchPlan = buildNextSearchPlan(card, debug);

  switch (card.cardType) {
    case "inventory": {
      const data = (card.data ?? {}) as Record<string, unknown>;
      const media = data.media as Record<string, unknown> | undefined;
      const vehicleInfo = data.vehicleInfo as Record<string, unknown> | undefined;

      // Resolve model from multiple sources (vehicleInfo > card filters > response smartFilters > title)
      const cardFilters = (card.nextSearchPlan as Record<string, unknown> | undefined)?.filters as
        | unknown[]
        | undefined;
      const modelFromSmartFilters = extractModelFromSmartFilters(
        debug.turnContext as Record<string, unknown> | undefined
      );

      const resolvedModel =
        (vehicleInfo?.model as string | undefined) ??
        extractModelFromFilters(cardFilters) ??
        modelFromSmartFilters ??
        undefined;

      return {
        data: { vehicle: data },
        id: card.id,
        image: resolveCardImage({
          apiImage: (media?.primaryImageUrl as string) ?? undefined,
          bodyType: resolvedModel ?? (data.title as string) ?? undefined,
          color: vehicleInfo?.exteriorColor as string | undefined,
          make: vehicleInfo?.make as string | undefined,
          model: resolvedModel,
          trim: vehicleInfo?.trim as string | undefined,
          year: vehicleInfo?.year as number | undefined,
        }),
        nextSearchPlan,
        subtitle: undefined,
        title: (data.title as string) ?? card.id,
        type: "inventory",
      };
    }

    case "option": {
      return mapOptionCard(card, nextSearchPlan);
    }

    case "comparison": {
      const data = (card.data ?? {}) as Record<string, unknown>;
      const filters = (card.nextSearchPlan as Record<string, unknown>)?.filters as
        | unknown[]
        | undefined;
      const modelFromFilters = extractModelFromFilters(filters);

      return {
        data: { show: 3, specs: normalizeSpecs((data.attributes as unknown[]) ?? []) },
        id: card.id,
        image: resolveCardImage({
          apiImage: undefined,
          bodyType: (data.title as string) ?? undefined,
          model: modelFromFilters ?? (data.title as string) ?? undefined,
        }),
        nextSearchPlan,
        subtitle:
          (data.advisoryNote as string) ??
          (data.vin as string) ??
          (data.subtitle as string | undefined),
        title: (data.title as string) ?? card.id,
        type: "spec",
      };
    }

    case "concept": {
      const data = (card.data ?? {}) as Record<string, unknown>;
      const filters = (card.nextSearchPlan as Record<string, unknown>)?.filters as
        | unknown[]
        | undefined;
      const modelFromFilters = extractModelFromFilters(filters);

      return {
        data: { show: 1, specs: normalizeSpecs((data.attributes as unknown[]) ?? []) },
        id: card.id,
        image: resolveCardImage({
          apiImage: (data.thumbnailUrl as string) ?? undefined,
          bodyType: (data.title as string) ?? undefined,
          model: modelFromFilters ?? (data.title as string) ?? undefined,
        }),
        nextSearchPlan,
        subtitle: data.subtitle as string | undefined,
        title: (data.title as string) ?? card.id,
        type: "spec",
      };
    }

    default: {
      // Unknown card type from upstream — map to a pill as safe fallback
      return {
        id: undefined,
        nextSearchPlan,
        title: undefined,
        type: "pill",
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Complete Event Transformer
// ---------------------------------------------------------------------------

/**
 * Transforms a base Complete payload into the shape the frontend expects,
 * including debug context and turnContext for session traceability.
 */
export function transformBaseCompletePayload(
  payload: BaseCompletePayload,
  runtimeSessionId: string,
  visitorId: string | null,
  mapCard: CardMapper = mapBaseCard
): Record<string, unknown> {
  const { cards } = payload;

  // Parse each card once up front; reused for location, lastShownVins, and mapping.
  const parsedCards: BaseCardItem[] = [];
  for (const rawCard of cards.items) {
    const parsedCard = BaseCardItemSchema.safeParse(rawCard);
    if (!parsedCard.success) {
      const unknownType =
        rawCard !== null && typeof rawCard === "object" && "cardType" in rawCard
          ? (rawCard as Record<string, unknown>).cardType
          : "(unknown)";
      console.warn(
        `[transformBaseCompletePayload] Skipping unrecognized card (cardType: ${unknownType})`,
        parsedCard.error.issues
      );
      continue;
    }
    parsedCards.push(parsedCard.data);
  }

  // Build turnContext from the payload
  const turnContext: Record<string, unknown> = {};
  const _resolvedLocation =
    payload.effectiveLocation ??
    parsedCards
      .map((card) => (card.nextSearchPlan as Record<string, unknown> | undefined)?.location)
      .find((loc) => loc != null) ??
    null;

  turnContext.activeSearchPlan = {
    explorationAxes: [],
    filters:
      payload.smartFilters
        ?.map((f) =>
          f.type === "Range"
            ? { key: f.key, max: f.max, min: f.min }
            : {
                key: f.key,
                values: f.options?.map((opt) => opt.value).filter(Boolean) ?? [],
              }
        )
        .filter(
          (f) =>
            ("values" in f && (f.values as unknown[]).length > 0) ||
            f.min !== undefined ||
            f.max !== undefined
        ) ?? [],
    location: _resolvedLocation,
    responseMode: cards.responseMode,
    searchId: payload.searchId ?? null,
  };

  if (payload.smartFilters) {
    turnContext.smartFilters = payload.smartFilters;
  }

  turnContext.lastResponseMode = cards.responseMode;
  turnContext.lastShownVins = parsedCards.map((card) => card.id).filter(Boolean);

  // Build debug context
  const debug: BaseDebugContext = {
    invokeMode: "aws",
    runtimeSessionId,
    stream: true,
    turnContext,
    visitorId,
  };

  // Map each already-parsed card into the frontend shape.
  const transformedCards: MappedCard[] = parsedCards.map((card) =>
    mapCard(card, cards.responseMode, debug)
  );

  const extractedFilters =
    payload.smartFilters
      ?.map((f) =>
        f.type === "Range"
          ? { key: f.key, max: f.max, min: f.min }
          : { key: f.key, values: f.options?.map((opt) => opt.value).filter(Boolean) ?? [] }
      )
      .filter(
        (f) =>
          ("values" in f && (f.values as unknown[]).length > 0) ||
          f.min !== undefined ||
          f.max !== undefined
      ) ?? [];

  // Build response-level nextSearchPlan
  const responseNextSearchPlan: Record<string, unknown> = {
    debug,
    filters: extractedFilters,
    location: payload.effectiveLocation,
    searchId: payload.searchId,
  };

  return {
    payload: {
      effectiveLocation: payload.effectiveLocation,
      filters: extractedFilters,
      response: {
        nextSearchPlan: responseNextSearchPlan,
        responseMode: cards.responseMode,
        results: transformedCards,
        summary: cards.summary,
        totalCount: cards.totalCount,
        ...(cards.responseMode === "OptionCards"
          ? { optionLevel: cards.optionLevel ?? "Fallback" }
          : {}),
      },
      searchId: payload.searchId,
      searchMode: payload.searchMode,
      smartFilters: payload.smartFilters,
    },
    type: "Complete",
  };
}
