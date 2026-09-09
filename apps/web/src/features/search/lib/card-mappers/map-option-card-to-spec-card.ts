import type { SpecAttribute, SpecCardContentProps } from "@shared/components/spec-card";
import { normalizeImageUrl } from "@shared/lib/media";
import type { Attribute, OptionCard } from "../agent-search-turns-collection";

/**
 * Convert an API `Attribute` to the card's `SpecAttribute` shape.
 * Filters out attributes that are purely structural (e.g. "year") since the
 * year is handled in the card title, not as a spec row.
 */
function toSpecAttribute(attr: Attribute): SpecAttribute {
  return {
    key: attr.key,
    label: attr.label,
    value: attr.value,
    min: attr.min,
    max: attr.max,
    options: attr.options?.map((opt) => ({ value: opt.value })),
  };
}

/** Keys excluded from spec rows — they're surfaced elsewhere on the card. */
const EXCLUDED_KEYS = new Set(["year"]);

/**
 * Maps an OptionCard (generic agent response) to SpecCardContentProps.
 *
 * The card renders all non-excluded attributes as spec rows. The BFF decides
 * how many specs to show via `specCount` at the response level; this mapper
 * preserves all attributes so the consumer can slice as needed.
 */
export function mapOptionCardToSpecCard(card: OptionCard): SpecCardContentProps {
  const specs: SpecAttribute[] = (card.attributes ?? [])
    .filter((attr) => !EXCLUDED_KEYS.has(attr.key))
    .map(toSpecAttribute);

  return {
    availableCount: card.availableCount,
    title: card.title,
    subtitle: card.subtitle,
    image: card.image ? { src: normalizeImageUrl(card.image), alt: card.title } : undefined,
    specs,
  };
}
