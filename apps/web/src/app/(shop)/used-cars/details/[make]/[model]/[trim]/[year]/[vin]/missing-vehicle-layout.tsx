import {
  EditorialSuggestionsCarousel,
  StatusCard,
  StatusHeroCard,
  UNAVAILABLE_VEHICLE_EDITORIAL_CARDS,
  UnavailableVehicleLayout,
} from "@features/vehicle-detail";
import soldHeroTablet from "@public/images/vdp/sold-hero.png";
import soldHeroDesktop from "@public/images/vdp/sold-hero-desktop.png";
import soldHeroMobile from "@public/images/vdp/sold-hero-mobile.png";

/**
 * Sold hero images — static imports give compile-time path validation.
 * `.src` is used because StatusHeroCard renders a native <picture>/<img>
 * (not next/image) and requires plain string URLs.
 */
const SOLD_HERO_IMAGE_MOBILE = soldHeroMobile.src;
const SOLD_HERO_IMAGE_TABLET = soldHeroTablet.src;
const SOLD_HERO_IMAGE_DESKTOP = soldHeroDesktop.src;

function safeDecodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatVehicleSegment(value: string): string {
  return safeDecodeSegment(value)
    .split("-")
    .filter(Boolean)
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

interface MissingVehicleLayoutProps {
  make?: string;
  model?: string;
  trim?: string;
  year?: string;
}

export function MissingVehicleLayout({
  make = "",
  model = "",
  trim = "",
  year = "0",
}: MissingVehicleLayoutProps = {}) {
  const vehicle = {
    make: formatVehicleSegment(make),
    model: formatVehicleSegment(model),
    trim: formatVehicleSegment(trim),
    year: Number(year) || 0,
  };
  const vehicleKey = [year, make, model, trim].join(":");

  return (
    <UnavailableVehicleLayout
      heroCard={
        <StatusHeroCard
          alt="Vehicle not found"
          ctaCard={<StatusCard key={vehicleKey} variant="not-found" vehicle={vehicle} />}
          imageUrl={SOLD_HERO_IMAGE_MOBILE}
          imageUrlDesktop={SOLD_HERO_IMAGE_DESKTOP}
          imageUrlTablet={SOLD_HERO_IMAGE_TABLET}
          key={vehicleKey}
        />
      }
      recommendations={<EditorialSuggestionsCarousel cards={UNAVAILABLE_VEHICLE_EDITORIAL_CARDS} />}
    />
  );
}
