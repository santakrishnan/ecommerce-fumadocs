import {
  CARD_HOVER_SCALE,
  type CardBadgeIconName,
  CardCarousel,
  type CardSize,
} from "@shared/components/card";
import type { ReactNode } from "react";
import type { ComparisonMetric } from "./comparison-card-content";
import { LinkComparisonCard } from "./link-comparison-card";

export interface ComparisonVehicle {
  /** Badge icon component passed directly (client-side override). */
  badgeIcon?: ReactNode;
  /** Serializable icon name from API — resolved via BADGE_ICON_MAP inside CardBadge. */
  badgeIconName?: CardBadgeIconName;
  /** AI badge label (e.g. "Most space"). */
  badgeLabel?: string;
  /** Short AI-generated description. */
  description?: string;
  /** Link destination for the card. Defaults to "#". */
  href?: string;
  id: string;
  /** Transparent vehicle render. */
  imageUrl: string;
  /** 1 or 2 comparison metrics. */
  metrics: ComparisonMetric[];
  /** Vehicle title (e.g. "HIGHLANDER HYBRID"). */
  title: string;
  /** Model year. */
  year?: string | number;
}

interface ComparisonCardCarouselProps {
  /** Accessible label for the carousel region. */
  "aria-label"?: string;
  /** Shared card size token. Default: "search". */
  size?: CardSize;
  /** List of comparison vehicles to render. */
  vehicles: ComparisonVehicle[];
}

/**
 * Thin adapter over the generic `CardCarousel` that renders `ComparisonCard`s.
 * Compose inside a `<section>` with a `SectionHeader`.
 */
export function ComparisonCardCarousel({
  vehicles,
  size = "search",
  "aria-label": ariaLabel = "Vehicle comparison",
}: ComparisonCardCarouselProps) {
  return (
    <CardCarousel
      aria-label={ariaLabel}
      getItemKey={(vehicle) => vehicle.id}
      hoverScaleRatio={CARD_HOVER_SCALE[size]}
      items={vehicles}
      renderItem={(vehicle) => (
        <LinkComparisonCard
          badgeIcon={vehicle.badgeIcon}
          badgeIconName={vehicle.badgeIconName}
          badgeLabel={vehicle.badgeLabel}
          description={vehicle.description}
          image={{ src: vehicle.imageUrl, alt: `${vehicle.year ?? ""} ${vehicle.title}`.trim() }}
          linkProps={{ href: vehicle.href ?? "#" }}
          metrics={vehicle.metrics}
          size={size}
          title={vehicle.title}
          year={vehicle.year}
        />
      )}
    />
  );
}
