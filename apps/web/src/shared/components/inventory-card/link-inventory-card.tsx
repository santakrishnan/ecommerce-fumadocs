import { type CardLinkProps, LinkCard } from "@shared/components/card";
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

export type { InventoryBadgeData, Vehicle } from "./inventory-card-types";

export interface LinkInventoryCardProps {
  /** AI description — overrides vehicle.aiDescription when both provided. */
  aiDescription?: string;
  /**
   * Aspect ratio for the card image. When provided, uses AspectFillImage mode
   * (self-sizing container) instead of absolute fill positioning.
   */
  aspectRatio?: number | string;
  /** Badge data — overrides vehicle.badge when provided. */
  badge?: InventoryBadgeData;
  /**
   * Controls how the `aiDescription` is revealed.
   * - `"always"` (default): visible at all times.
   * - `"hover"`: hidden by default, slides up and fades in on card hover/focus.
   */
  descriptionReveal?: DescriptionReveal;
  /** Link destination — overrides vehicle.href when both provided. Defaults to "/". */
  href?: string;
  /** All valid Next.js Link props (overrides href/aria-label if also provided). */
  linkProps?: Partial<CardLinkProps>;
  /** Original price — overrides vehicle.originalPrice when both provided. */
  originalPrice?: number;
  /** Mark as LCP image — loads eagerly without lazy loading. */
  priority?: boolean;
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
  /**
   * Image rendering variant passed to InventoryCardContent.
   * - `"cover"` (default): full-bleed object-cover.
   * - `"gradient"`: image at top, gradient fill below for text contrast.
   */
  variant?: "cover" | "gradient";
  vehicle: Vehicle;
  /** Extra classes applied to the outer card wrapper (e.g. hover-scale hooks). */
  wrapperClassName?: string;
}

/**
 * Navigable inventory card — full-bleed vehicle photo with overlaid metadata.
 * Server Component safe. SaveButton is a client island via adornments slot.
 */
export function LinkInventoryCard({
  aiDescription,
  aspectRatio,
  badge,
  descriptionReveal,
  href,
  linkProps,
  originalPrice,
  priority,
  showBadge = false,
  showSaveButton,
  size = "small",
  startIcon,
  surface,
  variant,
  vehicle,
  wrapperClassName,
}: LinkInventoryCardProps) {
  const resolvedSurface = surface ?? vehicle.surface ?? (variant === "gradient" ? "dark" : "light");
  const sizeToken = SIZE_TOKEN[size];
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
  const shouldShowSaveButton =
    (showSaveButton ?? vehicle.showBadge ?? false) && Boolean(vehicle.vin);
  const resolvedBadge = badge ?? vehicle.badge;
  const resolvedHref = href ?? vehicle.href ?? "/";
  const resolvedAiDescription = aiDescription ?? vehicle.aiDescription;
  const resolvedOriginalPrice = originalPrice ?? vehicle.originalPrice;

  return (
    <LinkCard
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
      className={cn(
        "relative gap-0 overflow-clip border-0 p-0 shadow-none ring-0",
        variant === "gradient" ? "bg-transparent" : "bg-surface-primary"
      )}
      data-surface={resolvedSurface}
      linkProps={{
        "aria-label": `${vehicleLabel} — ${formatPrice(vehicle.price)}`,
        href: resolvedHref,
        ...linkProps,
      }}
      wrapperClassName={cn("w-full shrink-0", INVENTORY_CARD_SIZE[sizeToken], wrapperClassName)}
    >
      <InventoryCardContent
        aiDescription={resolvedAiDescription}
        aspectRatio={aspectRatio}
        badge={resolvedBadge}
        descriptionReveal={descriptionReveal}
        imageAlt={vehicleLabel}
        imageSrc={vehicle.imageUrl}
        mileage={vehicle.mileage}
        model={vehicle.model}
        originalPrice={resolvedOriginalPrice}
        price={vehicle.price}
        priority={priority}
        showBadge={showBadge}
        size={size}
        startIcon={startIcon}
        trim={vehicle.trim}
        variant={variant}
        year={vehicle.year}
      />
    </LinkCard>
  );
}
