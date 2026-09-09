"use client";

import { ButtonCard, type CardButtonProps } from "@shared/components/card";
import { SaveButtonClient as SaveButton } from "@shared/components/inventory-card/save-button-client";
import type { Surface } from "@ucmp/ui";
import type { ReactNode } from "react";
import { cn, formatPrice } from "utils";
import {
  type DescriptionReveal,
  InventoryCardContent,
  type InventoryCardSize,
  SIZE_TOKEN,
} from "./inventory-card-content";
import { INVENTORY_CARD_SIZE } from "./inventory-card-size";
import type { InventoryBadgeData, Vehicle } from "./inventory-card-types";

export interface ButtonInventoryCardProps {
  /** AI description — overrides vehicle.aiDescription when both provided. */
  aiDescription?: string;
  /** Badge data — overrides vehicle.badge when provided. */
  badge?: InventoryBadgeData;
  /** All valid button props — spread onto the button element. */
  buttonProps: CardButtonProps;
  /**
   * Controls how the `aiDescription` is revealed.
   * - `"always"` (default): visible at all times.
   * - `"hover"`: hidden by default, slides up and fades in on card hover/focus.
   */
  descriptionReveal?: DescriptionReveal;
  /** Original price — overrides vehicle.originalPrice when both provided. */
  originalPrice?: number;
  /** Show the card badge (top-left pill). */
  showBadge?: boolean;
  /** Show the save/heart button (top-right). */
  showSaveButton?: boolean;
  size?: InventoryCardSize;
  /** Icon component for the badge (client-side override). */
  startIcon?: ReactNode;
  /**
   * Surface context — sets `data-surface` on the card root.
   * @default "light"
   */
  surface?: Surface;
  vehicle: Vehicle;
}

/**
 * Clickable inventory card — full-bleed vehicle photo with overlaid metadata.
 * Client Component (accepts non-serializable onClick).
 */
export function ButtonInventoryCard({
  aiDescription,
  badge,
  buttonProps,
  descriptionReveal,
  originalPrice,
  showBadge = false,
  showSaveButton,
  size = "small",
  startIcon,
  surface,
  vehicle,
}: ButtonInventoryCardProps) {
  const resolvedSurface = surface ?? vehicle.surface ?? "light";
  const sizeToken = SIZE_TOKEN[size];
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
  const shouldShowSaveButton =
    (showSaveButton ?? vehicle.showBadge ?? false) && Boolean(vehicle.vin);
  const resolvedBadge = badge ?? vehicle.badge;
  const resolvedAiDescription = aiDescription ?? vehicle.aiDescription;
  const resolvedOriginalPrice = originalPrice ?? vehicle.originalPrice;

  return (
    <ButtonCard
      adornments={
        shouldShowSaveButton ? (
          <SaveButton
            badgePosition="top-2 right-2"
            vehicle={vehicle}
            vehicleId={vehicle.vin as string}
            vehicleLabel={vehicleLabel}
          />
        ) : undefined
      }
      buttonProps={{
        "aria-label": `${vehicleLabel} — ${formatPrice(vehicle.price)}`,
        ...buttonProps,
      }}
      className="relative gap-0 overflow-clip border-0 bg-surface-primary p-0 shadow-none ring-0"
      data-surface={resolvedSurface}
      wrapperClassName={cn("w-full shrink-0", INVENTORY_CARD_SIZE[sizeToken])}
    >
      <InventoryCardContent
        aiDescription={resolvedAiDescription}
        badge={resolvedBadge}
        descriptionReveal={descriptionReveal}
        imageAlt={vehicleLabel}
        imageSrc={vehicle.imageUrl}
        mileage={vehicle.mileage}
        model={vehicle.model}
        originalPrice={resolvedOriginalPrice}
        price={vehicle.price}
        showBadge={showBadge}
        size={size}
        startIcon={startIcon}
        trim={vehicle.trim}
        year={vehicle.year}
      />
    </ButtonCard>
  );
}
