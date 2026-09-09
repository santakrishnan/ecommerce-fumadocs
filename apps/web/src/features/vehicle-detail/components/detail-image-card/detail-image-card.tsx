import type { Surface } from "@ucmp/ui";
import { Button, Card, Eyebrow } from "@ucmp/ui";
import { IconAdd, IconToyotaX } from "@ucmp/ui/icons";
import Image from "next/image";
import Link from "next/link";
import type { Ref } from "react";
import { cn } from "utils";

/** Named size → responsive height classes (Tailwind-safe bracketed rem values). */
const DETAIL_CARD_SIZE = {
  large: "h-[22.625rem] md:h-[26rem] lg:h-[32.25rem]",
  medium: "h-[11.1875rem] md:h-[22.5rem] lg:h-[29.375rem]",
} as const;

/** Responsive `sizes` hints per card size for optimal image loading. */
const DETAIL_CARD_IMAGE_SIZES = {
  large: "(min-width: 1024px) 516px, (min-width: 768px) 416px, 362px",
  medium: "(min-width: 1024px) 470px, (min-width: 768px) 360px, 179px",
} as const;

export type DetailImageCardSize = keyof typeof DETAIL_CARD_SIZE;

export interface DetailImageCardProps {
  /**
   * Optional badge pill text (e.g. "For You", "Rare Find").
   * When present, rendered as an Eyebrow with the Toyota X icon above the label.
   */
  badge?: string;
  /**
   * Additional CSS classes to merge into the card root.
   * Applied after size classes via cn() utility.
   */
  className?: string;
  /**
   * Card link destination. When omitted, no link overlay is rendered
   * and the card functions as a read-only display.
   * Typically points to a detail view or gallery page.
   */
  href?: string;
  /** Alt text for the background image. Critical for accessibility and screen readers. */
  imageAlt: string;
  /**
   * Background image URL. Can be relative (e.g. "/images/car.jpg") or absolute.
   * If using remote images, ensure the domain is registered in next.config.ts imageRemotePatterns.
   */
  imageUrl?: string;
  /** Primary label (e.g. "Exterior", "Interior"). Rendered as h3 in body-xxl typography. */
  label: string;
  /**
   * Local action handler for a non-navigational trigger (e.g. opening an overlay).
   * When provided and `href` is omitted, the whole-card overlay and optional action
   * button render as plain buttons instead of links, avoiding invalid nested
   * interactive elements and unintended navigation/history side effects.
   * Ignored when `href` is also provided — `href` takes precedence for navigation.
   */
  onAction?: () => void;
  /**
   * Load the image with high priority (eager loading, no lazy load).
   * Set to true if this card is the Largest Contentful Paint (LCP) element on the page.
   * Typically only the first above-the-fold card should have priority=true.
   * @default false
   */
  priority?: boolean;
  /**
   * Ref forwarded to the card root element. Useful for callers that need to
   * measure the card (e.g. an overlay that expands from the card's rect).
   */
  ref?: Ref<HTMLDivElement>;
  /**
   * Show a circular "+" icon button in the bottom-right corner.
   * When true, renders as a link (with `href`) or a local action button
   * (with `onAction`) to the gallery or detail view.
   * The button is elevated at z-20 above the link/action overlay.
   */
  showActionButton?: boolean;
  /** Card height variant — controls responsive sizing at mobile, tablet, and desktop breakpoints. */
  size: DetailImageCardSize;
  /**
   * Optional sub-label (e.g. '20" Alloy' for wheels, 'Heated Seats' for interior).
   * Rendered between badge and label with body-sm/md typography.
   */
  subLabel?: string;
  /**
   * Surface context for text token inheritance.
   * Controls whether text uses light-on-dark or dark-on-light tokens.
   * - "dark": light text on dark background (default for detail pages)
   * - "light": dark text on light background
   * @default "dark"
   */
  surface?: Surface;
  /**
   * Color swatch CSS color value in hex format (e.g. "#1A1A1A").
   * When provided and no imageUrl is set, the card renders in "color swatch" mode:
   * - No background image or gradient
   * - Dark semi-transparent background (black/26)
   * - Color circle at the top, label/subLabel at the bottom (justify-between)
   */
  swatchColor?: string;
  /**
   * URL of a material/texture image for the interior swatch circle.
   * Used as a fallback when swatchColor hex is absent — renders a background-image
   * circle instead of a solid colour circle. Ignored when swatchColor is present.
   */
  swatchImageUrl?: string;
}

/**
 * DetailImageCard — an image-based card for the VDP left column grid.
 *
 * Displays a full-bleed background image with a dark gradient overlay at the
 * bottom for text legibility. Label and optional badge are positioned
 * bottom-left. The entire card acts as a tap target.
 *
 * Uses the shared Card component from `@ucmp/ui` for structure, with
 * `data-surface` for surface-aware text tokens.
 */
export function DetailImageCard({
  badge,
  className,
  href,
  imageAlt,
  imageUrl,
  label,
  onAction,
  priority = false,
  ref,
  showActionButton,
  size,
  subLabel,
  surface = "dark",
  swatchColor,
  swatchImageUrl,
}: DetailImageCardProps) {
  const isSwatchMode = (!!swatchColor || !!swatchImageUrl) && !imageUrl;
  const hasNoImage = !imageUrl;
  // A local action trigger only applies when no navigational href is present —
  // href always wins so existing link-based consumers are unaffected.
  const hasLocalAction = !href && !!onAction;

  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden border-0 p-0 shadow-none ring-0",
        DETAIL_CARD_SIZE[size],
        hasNoImage && "bg-opacity-black-26",
        className
      )}
      data-slot="detail-image-card"
      data-surface={surface}
      ref={ref}
    >
      {/* Whole-card link overlay — z-10 above content, below action button */}
      {href && (
        <Link aria-label={label} className="absolute inset-0 z-10" href={href}>
          <span className="sr-only">{label}</span>
        </Link>
      )}

      {/* Whole-card local action trigger — used when the card performs a local
          action (e.g. opening a gallery overlay) instead of navigating. Plain
          button avoids nested interactive elements and unwanted history entries. */}
      {hasLocalAction && (
        <button
          aria-label={label}
          className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={onAction}
          type="button"
        >
          <span className="sr-only">{label}</span>
        </button>
      )}

      {/* Background image — only in image mode */}
      {!isSwatchMode && imageUrl && (
        <Image
          alt={imageAlt}
          className="object-cover"
          fill
          priority={priority}
          sizes={DETAIL_CARD_IMAGE_SIZES[size]}
          src={imageUrl}
        />
      )}

      {/* Dark gradient overlay — only when an image is present (not swatch, not empty) */}
      {!isSwatchMode && imageUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[43%] bg-linear-to-t from-black to-transparent"
        />
      )}

      {/* Content layout */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col p-6 lg:p-8",
          hasNoImage && isSwatchMode ? "justify-between" : "justify-end gap-2"
        )}
      >
        {/* Color swatch circle — only when color/texture data is available */}
        {isSwatchMode && (
          <div
            aria-hidden="true"
            className="size-12 rounded-full md:size-20 lg:size-25"
            style={
              swatchColor
                ? { backgroundColor: swatchColor }
                : {
                    backgroundImage: `url(${swatchImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
            }
          />
        )}

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1 lg:gap-2">
            {/* Badge eyebrow with brand AI star */}
            {badge && (
              <Eyebrow className="body-md lg:body-lg text-text-primary">
                <IconToyotaX />
                {badge}
              </Eyebrow>
            )}

            {/* Optional sub-label */}
            {subLabel && <p className="body-sm lg:body-md text-text-primary">{subLabel}</p>}

            {/* Primary label */}
            <h3 className="body-xxl text-text-primary">{label}</h3>
          </div>

          {/* Circular + icon button — bottom-right, z-20 above link/action overlay */}
          {showActionButton && href && (
            <Button
              aria-label={`View more ${label}`}
              className="relative z-20"
              nativeButton={false}
              render={<Link href={href} />}
              size="icon-sm"
              surface="dark"
              variant="secondary"
            >
              <IconAdd />
            </Button>
          )}
          {showActionButton && hasLocalAction && (
            <Button
              aria-label={`View more ${label}`}
              className="relative z-20"
              onClick={onAction}
              size="icon-sm"
              surface="dark"
              variant="secondary"
            >
              <IconAdd />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
