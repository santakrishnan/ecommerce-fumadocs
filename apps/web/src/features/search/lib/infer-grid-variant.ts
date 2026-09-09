import type { InventoryResultsGridProps } from "@shared/components/inventory-card";

export type InferredGridVariant = InventoryResultsGridProps["variant"] | null;

/**
 * Infers the inventory grid layout variant from card type and count.
 *
 * Rules:
 * - cardType !== "inventory" -> null (use carousel)
 * - 8 cards -> "14-cards-small" (8-card baseline from updated Inventory API)
 * - 6 cards -> "14-cards-small" (always use 14-style until further guidance)
 * - Any other count (4, 5, etc.) -> null (use normal CardCarousel)
 *
 * NOTE: Until further guidance, we always use the "14-cards-small" variant
 * style for grid-eligible responses. The 6-cards-mix and 6-cards-small
 * variants remain available in InventoryResultsGrid but are not triggered
 * by count inference in this story.
 *
 * When the backend provides an explicit inventoryGridVariant field,
 * it should override this count-based inference (explicit > inferred).
 */
export function inferGridVariant(
  cardType: string,
  cardCount: number,
  explicitVariant?: InventoryResultsGridProps["variant"]
): InferredGridVariant {
  if (cardType !== "inventory") {
    return null;
  }

  if (explicitVariant) {
    return explicitVariant;
  }

  if (cardCount >= 6 && cardCount <= 14) {
    return "14-cards-small";
  }

  return null;
}
