import { CardCarousel, type CardCarouselProps } from "@shared/components/card";
import type { PageSource } from "@ucmp/sdk-visitor-profile-api";
import {
  type DescriptionReveal,
  type InventoryCardSize,
  SIZE_TOKEN,
} from "./inventory-card-content";
import { INVENTORY_CARD_HOVER_SCALE } from "./inventory-card-size";
import type { Vehicle } from "./inventory-card-types";
import { LinkInventoryCardClient } from "./link-inventory-card-client";

interface InventoryCardCarouselProps
  extends Pick<CardCarouselProps<Vehicle>, "aria-label" | "colSpan" | "disableArrows" | "surface"> {
  /**
   * PageSource for the surface where this carousel is rendered. Used to fire
   * a `visitorActivity.vehicle.clicked` event when the visitor navigates to
   * the VDP.
   */
  activitySource: PageSource;
  /**
   * Controls how the `aiDescription` is revealed on each card.
   * - `"always"` (default): visible at all times.
   * - `"hover"`: hidden by default, slides up and fades in on card hover/focus.
   */
  descriptionReveal?: DescriptionReveal;
  /** Show the save (badge) button on each card. Default: false. */
  showSaveIcon?: boolean;
  size?: InventoryCardSize;
  /** Card image variant. `"gradient"` renders the gradient overlay frame. */
  variant?: "cover" | "gradient";
  vehicles: Vehicle[];
}

/**
 * Thin adapter over the generic `CardCarousel` that renders `InventoryCard`s —
 * the reusable "inventory track" (no section chrome). Hover-scale is derived
 * from the card size (smaller cards lift more).
 */
export function InventoryCardCarousel({
  vehicles,
  activitySource,
  descriptionReveal,
  size = "small",
  showSaveIcon = false,
  surface,
  variant,
  disableArrows,
  colSpan,
  "aria-label": ariaLabel,
}: InventoryCardCarouselProps) {
  return (
    <CardCarousel
      aria-label={ariaLabel}
      colSpan={colSpan}
      disableArrows={disableArrows}
      getItemKey={(vehicle) => vehicle.id}
      hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE[SIZE_TOKEN[size]]}
      items={vehicles}
      renderItem={(vehicle) => (
        <LinkInventoryCardClient
          activitySource={activitySource}
          descriptionReveal={descriptionReveal}
          showSaveButton={showSaveIcon}
          size={size}
          variant={variant}
          vehicle={vehicle}
        />
      )}
      surface={surface}
    />
  );
}
