import type { TrimVehicle } from "@shared/components/trim-card";
import { normalizeImageUrl } from "@shared/lib/media";
import { getAttributeValue, normalizeAttributeToken } from "utils";
import type { OptionCard } from "../agent-search-turns-collection";

export function mapOptionCardToTrimCard(card: OptionCard): TrimVehicle {
  const specs = (card.attributes ?? [])
    .filter((attribute) => {
      const keyToken = normalizeAttributeToken(attribute.key);
      const labelToken = normalizeAttributeToken(attribute.label);
      return ![keyToken, labelToken].some((token) => token === "year" || token === "colors");
    })
    .map((attribute) => ({
      label: attribute.label,
      value: attribute.value ?? "",
    }))
    .filter((spec) => spec.value.length > 0);

  return {
    availableCount: card.availableCount,
    description: card.subtitle,
    id: card.id,
    imageUrl: normalizeImageUrl(card.image),
    specs,
    title: card.title,
    year: getAttributeValue(card, ["year"]),
  };
}
