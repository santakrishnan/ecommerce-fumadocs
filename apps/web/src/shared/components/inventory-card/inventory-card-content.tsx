import { CardBackgroundImage, CardBadge, type CardBadgeIconName } from "@shared/components/card";
import { CardContent, Eyebrow } from "@ucmp/ui";
import { IconToyotaX } from "@ucmp/ui/icons";
import type { ReactNode } from "react";
import { cn, formatMileage, formatPrice } from "utils";
import { GradientCardImage } from "./gradient-card-image";
import { INVENTORY_CARD_IMAGE_SIZES, type InventoryCardSizeToken } from "./inventory-card-size";

export type InventoryCardSize =
  | "small"
  | "medium"
  | "large"
  | "search"
  | "search-fill"
  | "search-fill-stacked";

/** Public size names → INVENTORY_CARD_SIZE scale tokens. */
export const SIZE_TOKEN: Record<InventoryCardSize, InventoryCardSizeToken> = {
  large: "lg",
  medium: "md",
  search: "search",
  "search-fill": "search-fill",
  "search-fill-stacked": "search-fill-stacked",
  small: "sm",
};

/** Overlay positioning + typography per size. */
const CONTENT_CONFIG = {
  small: {
    content: "right-4 bottom-5 left-4",
    gap: "gap-1",
    price: "body-sm",
    heading: "vehicle-title-sm",
    metadata: "body-sm",
  },
  medium: {
    content: "right-6 bottom-8 left-6",
    gap: "gap-1",
    price: "body-md",
    heading: "vehicle-title-md",
    metadata: "body-md",
  },
  large: {
    content: "right-8 bottom-10 left-8 lg:right-8 lg:left-8",
    gap: "gap-2",
    price: "body-lg",
    heading: "vehicle-title-lg lg:vehicle-title-md xl:vehicle-title-lg",
    metadata: "body-lg",
  },
  search: {
    content: "right-6 bottom-8 left-6 lg:right-6 lg:bottom-10 lg:left-6",
    gap: "gap-1",
    price: "body-lg",
    heading: "h3",
    metadata: "body-lg",
  },
  "search-fill": {
    content: "right-6 bottom-10 left-6 lg:right-6 lg:left-6",
    gap: "gap-2",
    price: "body-lg",
    heading: "vehicle-title-lg lg:vehicle-title-md",
    metadata: "body-lg",
  },
  "search-fill-stacked": {
    content: "right-4 bottom-5 left-4",
    gap: "gap-1",
    price: "body-sm",
    heading: "vehicle-title-sm",
    metadata: "body-sm",
  },
} as const;

/** Controls how the aiDescription is revealed. */
export type DescriptionReveal = "always" | "hover";

export interface InventoryCardContentProps {
  /** AI-generated one-line description. */
  aiDescription?: string;
  /**
   * Aspect ratio for the image container.
   * - With `variant="cover"` + aspectRatio: uses AspectFillImage container.
   * - With `variant="gradient"`: sets the GradientImage frame aspect ratio.
   */
  aspectRatio?: number | string;
  /** Badge data — rendered when showBadge is true. */
  badge?: { iconName?: CardBadgeIconName; label: string };
  /**
   * Controls how the `aiDescription` is revealed.
   * - `"always"` (default): visible at all times.
   * - `"hover"`: hidden by default, slides up and fades in on card hover/focus.
   */
  descriptionReveal?: DescriptionReveal;
  /** Vehicle image alt text. */
  imageAlt: string;
  /** Vehicle image URL. */
  imageSrc: string;
  /** Formatted mileage string (e.g. "30,000 mi"). */
  mileage: number;
  /** Vehicle model name. */
  model: string;
  /** Original price before sale. Shows strikethrough when provided and > price. */
  originalPrice?: number;
  /** Current price. */
  price: number;
  /** Mark as LCP image — loads eagerly without lazy loading. */
  priority?: boolean;
  /** Show the card badge (top-left pill). */
  showBadge?: boolean;
  size?: InventoryCardSize;
  /** Icon component for the badge (client-side override). */
  startIcon?: ReactNode;
  /** Vehicle trim name. */
  trim?: string;
  /**
   * Card image rendering variant.
   * - `"cover"` (default): full-bleed object-cover image filling the entire card.
   * - `"gradient"`: image shown full-width at the top of the card; a gradient
   *   sampled from the image bottom edge fills the remaining space, giving
   *   text a contrasting background.
   */
  variant?: "cover" | "gradient";
  /** Vehicle year. */
  year: number;
}

/**
 * Visual content for an inventory card — full-bleed background image, badge,
 * price row, model/trim heading, and year/mileage metadata.
 * No shell, no interactivity. Compose inside LinkCard/ButtonCard.
 */
export function InventoryCardContent({
  aiDescription,
  aspectRatio,
  badge,
  descriptionReveal = "always",
  imageAlt,
  imageSrc,
  mileage,
  model,
  originalPrice,
  price,
  priority,
  showBadge = false,
  size = "small",
  startIcon,
  trim,
  variant = "cover",
  year,
}: InventoryCardContentProps) {
  const sizeToken = SIZE_TOKEN[size];
  const config = CONTENT_CONFIG[size];
  const isSale = originalPrice != null && originalPrice > price;
  const hasHoverReveal = descriptionReveal === "hover" && !!aiDescription;

  const badgeElement = showBadge && badge && (
    <CardBadge
      className="absolute top-2 left-2 z-20 bg-neutral-700 [&>svg]:text-brand"
      startIcon={startIcon}
      startIconName={badge.iconName}
      variant="inverse"
    >
      {badge.label}
    </CardBadge>
  );

  const textOverlay = (
    <CardContent
      className={cn(
        "absolute z-1 flex flex-col p-0 text-text-primary",
        config.content,
        config.gap,
        hasHoverReveal && [
          "transition-transform duration-300 ease-out",
          "group-focus-within/card:-translate-y-6 group-hover/card:-translate-y-6",
          "motion-reduce:transform-none motion-reduce:transition-none",
        ]
      )}
    >
      {/* Price row */}
      <div className="flex items-center gap-1.5">
        <p className={cn("text-left", config.price)}>{formatPrice(price)}</p>
        {isSale && (
          <p className={cn("text-left line-through", config.price)} data-slot="original-price">
            {formatPrice(originalPrice)}
          </p>
        )}
      </div>
      {/* Model + Trim (bold, uppercase) */}
      <h3 className={cn("text-left", config.heading)}>
        {model}
        {trim ? (
          <>
            <br />
            {trim}
          </>
        ) : null}
      </h3>
      {/* Year • Mileage */}
      <div className="flex items-center gap-1">
        <p className={cn("text-left", config.metadata)}>{year}</p>
        <span className="flex items-center">•</span>
        <p className={cn("text-left", config.metadata)}>{formatMileage(mileage)}</p>
      </div>
      {aiDescription && (
        <Eyebrow
          className={cn(
            "mt-2",
            hasHoverReveal && [
              "mt-0 h-0 translate-y-4 overflow-visible",
              "lg:body-sm",
              "opacity-0",
              "group-focus-within/card:opacity-100 group-hover/card:opacity-100",
              "transition-opacity duration-300 ease-out",
              "motion-reduce:duration-0",
            ]
          )}
        >
          <IconToyotaX />
          {aiDescription}
        </Eyebrow>
      )}
    </CardContent>
  );

  if (variant === "gradient") {
    return (
      <>
        <GradientCardImage
          alt={imageAlt}
          aspectRatio={aspectRatio ?? "3/4"}
          priority={priority}
          sizes={INVENTORY_CARD_IMAGE_SIZES[sizeToken]}
          src={imageSrc}
        />
        {badgeElement}
        {textOverlay}
      </>
    );
  }

  return (
    <>
      <CardBackgroundImage
        alt={imageAlt}
        aspectRatio={aspectRatio}
        className={cn(
          hasHoverReveal &&
            "transition-[filter] duration-300 ease-out group-focus-within/card:brightness-110 group-hover/card:brightness-110"
        )}
        sizes={INVENTORY_CARD_IMAGE_SIZES[sizeToken]}
        src={imageSrc}
      />
      {badgeElement}
      {textOverlay}
    </>
  );
}
