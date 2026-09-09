import { ROUTES } from "@config/routes/constants";
import type { Vehicle } from "@shared/components/inventory-card";
import type { SpecAttribute, SpecCardContentProps } from "@shared/components/spec-card";
import { normalizeImageUrl, resolveHeroImageUrl } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing";
import type { SearchResultItem } from "../../types/search-results";
import type { Attribute } from "../agent-search-turns-collection";
import type {
  BaseMappedCard,
  BaseMappedInventoryCard,
  BaseMappedSpecCard,
} from "../base-agent-types";
import { resolveCardBadge, type V360VehicleData } from "../vehicle-badges";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Keys excluded from spec rows — surfaced elsewhere on the card. */
const EXCLUDED_KEYS = new Set(["year"]);

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

function mapSpecCardData(card: BaseMappedSpecCard): SpecCardContentProps {
  const rawSpecs = (card.data?.specs ?? []) as Attribute[];
  const specs: SpecAttribute[] = rawSpecs
    .filter((attr) => !EXCLUDED_KEYS.has(attr.key))
    .map(toSpecAttribute);

  return {
    availableCount: card.availableCount,
    title: card.title ?? "",
    subtitle: card.subtitle,
    image: card.image ? { src: normalizeImageUrl(card.image), alt: card.title ?? "" } : undefined,
    specs,
    specCount: card.data?.show,
  };
}

function mapInventoryCardData(card: BaseMappedInventoryCard): Vehicle {
  const vehicle = (card.data?.vehicle ?? {}) as Record<string, unknown>;
  const vehicleInfo = (vehicle?.vehicleInfo ?? {}) as Record<string, unknown>;
  const pricing = (vehicle?.pricing ?? {}) as Record<string, unknown>;
  const media = (vehicle?.media ?? {}) as Record<string, unknown>;
  const status = (vehicle?.status ?? {}) as Record<string, unknown>;

  const make = String(vehicleInfo?.make ?? "");
  const model = String(vehicleInfo?.model ?? "");
  const trim = String(vehicleInfo?.trim ?? "");
  const year = Number(vehicleInfo?.year ?? 0);
  const vin = String(vehicle?.vin ?? card.id ?? "");
  const price = resolveDisplayPrice({
    finalPrice: Number(pricing?.finalPrice) || undefined,
    sellingPrice: Number(pricing?.sellingPrice) || undefined,
    listPrice: Number(pricing?.listPrice) || undefined,
    msrp: Number(pricing?.msrp) || undefined,
  });
  const photos = (media?.photos ?? []) as { url: string; displayOrder: number }[];
  const imageUrl = normalizeImageUrl(
    (media?.primaryImageUrl as string) ?? resolveHeroImageUrl(photos)
  );
  const href = buildInventoryHref(make, model, trim, year, vin);
  const badge = resolveCardBadge(vehicle as V360VehicleData);

  return {
    id: vin,
    make,
    model,
    year,
    trim,
    price,
    mileage: Number(status?.mileage ?? 0),
    imageUrl,
    href,
    badge,
  };
}

function buildInventoryHref(
  make: string,
  model: string,
  trim: string,
  year: number,
  vin: string
): string | undefined {
  if (!(vin && make && model && year)) {
    return;
  }
  return ROUTES.vdpSafe({ make, model, trim, year, vin }) ?? undefined;
}
// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Maps a single base BFF-mapped card to a SearchResultItem.
 *
 * - "spec" cards → `type: "spec"` (ButtonSpecCard with nextSearchPlan onClick)
 * - "pill" cards → `type: "spec"` (rendered as minimal spec card with plan onClick)
 * - "inventory" cards → `type: "inventory"` (LinkInventoryCard with VDP href)
 * - "nudge" cards → `type: "nudge"` (guided-nudge recovery card with plan onClick)
 */
export function mapBaseCardToResultItem(card: BaseMappedCard): SearchResultItem {
  switch (card.type) {
    case "spec":
      return {
        type: "spec",
        id: card.id ?? crypto.randomUUID(),
        data: mapSpecCardData(card),
        nextSearchPlan: card.nextSearchPlan,
        sourceHint: "card",
      };

    case "pill":
      return {
        type: "pill",
        id: card.id ?? crypto.randomUUID(),
        data: { title: card.title ?? "" },
        nextSearchPlan: card.nextSearchPlan,
        sourceHint: "pill",
      };

    case "inventory":
      return {
        type: "inventory",
        id: card.id ?? crypto.randomUUID(),
        data: mapInventoryCardData(card),
        sourceHint: "card",
      };

    case "nudge":
      return {
        type: "nudge",
        id: card.id ?? crypto.randomUUID(),
        data: { title: card.title ?? "", subtitle: card.subtitle },
        nextSearchPlan: card.nextSearchPlan,
        sourceHint: "card",
      };

    default:
      return {
        type: "spec",
        id: (card as BaseMappedSpecCard).id ?? crypto.randomUUID(),
        data: mapSpecCardData(card as BaseMappedSpecCard),
        nextSearchPlan: (card as BaseMappedSpecCard).nextSearchPlan,
        sourceHint: "card",
      };
  }
}
