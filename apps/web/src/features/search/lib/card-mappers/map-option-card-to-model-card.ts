import type { ModelCardContentProps } from "@shared/components/model-card";
import { normalizeImageUrl } from "@shared/lib/media";
import { findAttribute, getAttributeValue } from "utils";
import type { OptionCard } from "../agent-search-turns-collection";

function getMetadataImageUrl(option: { metadata?: unknown; value: string }): string | undefined {
  if (typeof option.metadata !== "object" || option.metadata === null) {
    return;
  }

  const imageUrl = (option.metadata as { imageUrl?: unknown }).imageUrl;
  return typeof imageUrl === "string" && imageUrl.length > 0 ? imageUrl : undefined;
}

function isLikelyImagePath(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function getColorSwatches(card: OptionCard): NonNullable<ModelCardContentProps["colors"]> {
  const colorsAttribute = findAttribute(card, ["colors"]);
  const options = colorsAttribute?.options ?? [];

  return options
    .map((option) => {
      const metadataImageUrl = getMetadataImageUrl(option);
      const fallbackImageUrl = isLikelyImagePath(option.value) ? option.value : undefined;
      const svgSrc = metadataImageUrl ?? fallbackImageUrl;

      return {
        label: option.label ?? option.description ?? option.value,
        svgSrc: svgSrc ? normalizeImageUrl(svgSrc) : "",
      };
    })
    .filter((color) => color.svgSrc.length > 0);
}

function parseYearValue(value: string | undefined): number | undefined {
  if (!value) {
    return;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveYear(card: OptionCard): number {
  const attributeYear = parseYearValue(getAttributeValue(card, ["year"]));
  if (attributeYear !== undefined) {
    return attributeYear;
  }

  return new Date().getFullYear();
}

export function mapOptionCardToModelCard(card: OptionCard): ModelCardContentProps {
  return {
    availableCount: card.availableCount,
    title: card.title,
    year: resolveYear(card),
    carImage: normalizeImageUrl(card.image),
    averagePrice: getAttributeValue(card, ["averagePrice", "average price"]),
    capacity: getAttributeValue(card, ["capacity"]),
    description: card.subtitle,
    fuelEfficiency: getAttributeValue(card, ["fuelEfficiency", "fuel efficiency", "efficiency"]),
    colors: getColorSwatches(card),
  };
}
