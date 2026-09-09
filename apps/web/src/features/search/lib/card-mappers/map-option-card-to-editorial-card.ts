import type { EditorialCardData } from "@shared/components/editorial-card";
import { normalizeImageUrl } from "@shared/lib/media";
import { getAttributeValue } from "utils";
import type { OptionCard } from "../agent-search-turns-collection";

const VALID_ICON_NAMES = new Set<string>(["bolt", "binocular", "location"]);
const VALID_SURFACES = new Set<string>(["light", "dark"]);

export function mapOptionCardToEditorialCard(card: OptionCard): EditorialCardData {
  const href = getAttributeValue(card, ["href"]) ?? "#";

  const iconNameRaw = getAttributeValue(card, ["iconName"]);
  const iconName =
    iconNameRaw && VALID_ICON_NAMES.has(iconNameRaw)
      ? (iconNameRaw as "bolt" | "binocular" | "location")
      : undefined;

  const matchesRaw = getAttributeValue(card, ["matches"]);
  const matchesParsed = matchesRaw ? Number(matchesRaw) : Number.NaN;
  const matches = Number.isFinite(matchesParsed) ? matchesParsed : undefined;

  const surfaceRaw = getAttributeValue(card, ["surface"]);
  const surface =
    surfaceRaw && VALID_SURFACES.has(surfaceRaw) ? (surfaceRaw as "light" | "dark") : undefined;

  return {
    eyebrow: card.subtitle ?? "",
    headline: card.title,
    href,
    iconName,
    imageUrl: normalizeImageUrl(card.image ?? ""),
    matches,
    surface,
  };
}
