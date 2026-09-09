import { CARD_HOVER_SCALE, CardCarousel, type CardSize, type Spec } from "@shared/components/card";
import { LinkTrimCard } from "./link-trim-card";

export interface TrimVehicle {
  /** Available stock count for this trim. */
  availableCount?: number;
  /** Short description (e.g. "Starting at $28,950"). */
  description?: string;
  /** Link destination for the card. Defaults to "#". */
  href?: string;
  id: string;
  /** Transparent vehicle render. */
  imageUrl: string;
  /** Label/value spec rows. */
  specs: Spec[];
  /** Trim name (e.g. "LE", "XLE", "Limited"). */
  title: string;
  /** Model year. */
  year?: string | number;
}

interface TrimCardCarouselProps {
  /** Shared card size token. Default: "search". */
  size?: CardSize;
  /** List of trim vehicles to render in the carousel. */
  vehicles: TrimVehicle[];
}

/**
 * Thin adapter over the generic `CardCarousel` that renders `TrimCard`s.
 * Compose inside a `<section>` with a `SectionHeader`.
 */
export function TrimCardCarousel({ vehicles, size = "search" }: TrimCardCarouselProps) {
  return (
    <CardCarousel
      getItemKey={(vehicle) => vehicle.id}
      hoverScaleRatio={CARD_HOVER_SCALE[size]}
      items={vehicles}
      renderItem={(vehicle) => (
        <LinkTrimCard
          description={vehicle.description}
          image={{ src: vehicle.imageUrl, alt: `${vehicle.year ?? ""} ${vehicle.title}`.trim() }}
          linkProps={{ href: vehicle.href ?? "#" }}
          size={size}
          specs={vehicle.specs}
          title={vehicle.title}
          year={vehicle.year}
        />
      )}
    />
  );
}
