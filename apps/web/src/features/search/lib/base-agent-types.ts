/**
 * Base Agent Response Types
 *
 * The search agent BFF (v1 and v2 alike) transforms upstream cards into
 * `MappedCard` objects stored in `response.results`. Each card has a `type`
 * discriminator:
 *   - "spec" → generic spec card (attributes, image, title)
 *   - "pill" → lightweight option card (title + nextSearchPlan)
 *   - "inventory" → vehicle card with VIN data
 *   - "nudge" → guided-nudge recovery card (scope_gateway option)
 *
 * The response still carries a V2-style `responseMode` for backward compat,
 * but card rendering is driven by the per-card `type` field.
 */

import type { NextSearchPlan } from "./agent-search-turns-collection";

// ─── Base Mapped Card shapes (output from BFF agent-card.mapper) ──────────────

export interface BaseMappedSpecCard {
  availableCount?: number;
  data: { specs: unknown[]; show: number };
  id: string | undefined;
  image: string | undefined;
  nextSearchPlan: NextSearchPlan & Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "spec";
}

export interface BaseMappedPillCard {
  id: string | undefined;
  nextSearchPlan: NextSearchPlan & Record<string, unknown>;
  title: string | undefined;
  type: "pill";
}

export interface BaseMappedInventoryCard {
  data: { vehicle: Record<string, unknown> };
  id: string | undefined;
  image: string | undefined;
  nextSearchPlan: NextSearchPlan & Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "inventory";
}

export interface BaseMappedNudgeCard {
  id: string | undefined;
  nextSearchPlan: NextSearchPlan & Record<string, unknown>;
  subtitle: string | undefined;
  title: string | undefined;
  type: "nudge";
}

export type BaseMappedCard =
  | BaseMappedSpecCard
  | BaseMappedPillCard
  | BaseMappedInventoryCard
  | BaseMappedNudgeCard;

// ─── Type guards ──────────────────────────────────────────────────────────────

/**
 * Detects whether a `results` array contains base mapped cards (have a `type`
 * field) vs. V2 raw cards (InventoryCard, OptionCard, ComparisonCard — no
 * `type` field).
 *
 * Only checks the first result for efficiency.
 */
export function isBaseMappedResults(results: unknown[]): results is BaseMappedCard[] {
  if (results.length === 0) {
    return false;
  }

  const first = results[0] as Record<string, unknown>;
  return (
    typeof first === "object" &&
    first !== null &&
    "type" in first &&
    typeof first.type === "string" &&
    (first.type === "spec" ||
      first.type === "pill" ||
      first.type === "inventory" ||
      first.type === "nudge")
  );
}

export function isBaseSpecCard(card: BaseMappedCard): card is BaseMappedSpecCard {
  return card.type === "spec";
}

export function isBasePillCard(card: BaseMappedCard): card is BaseMappedPillCard {
  return card.type === "pill";
}

export function isBaseInventoryCard(card: BaseMappedCard): card is BaseMappedInventoryCard {
  return card.type === "inventory";
}

export function isBaseNudgeCard(card: BaseMappedCard): card is BaseMappedNudgeCard {
  return card.type === "nudge";
}
