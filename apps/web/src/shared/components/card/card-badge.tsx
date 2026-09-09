import { Badge, type BadgeProps } from "@ucmp/ui";
import type { IconProps } from "@ucmp/ui/icons";
import {
  IconBinocular,
  IconBolt,
  IconCheckCircle,
  IconClock,
  IconClockFilled,
  IconDocumentFilled,
  IconDollar,
  IconHeart,
  IconLocation,
  IconPriceTag,
  IconPriceTagFilled,
  IconToyotaX,
} from "@ucmp/ui/icons";
import type { ComponentType, ReactNode } from "react";

// ─── Icon Map ───────────────────────────────────────────────────────
// Resolves serializable icon names (from API/server) to React components.
// This solves the server→client boundary: icon names are plain strings
// that can be serialized, while actual components live only on the client.

/** Badge icon names supported in card badges. */
export type CardBadgeIconName =
  | "binocular"
  | "bolt"
  | "check-circle"
  | "clock"
  | "clock-filled"
  | "document-filled"
  | "dollar"
  | "heart"
  | "location"
  | "price-tag"
  | "price-tag-filled"
  | "toyota-x";

const BADGE_ICON_MAP: Record<CardBadgeIconName, ComponentType<IconProps>> = {
  binocular: IconBinocular,
  bolt: IconBolt,
  "check-circle": IconCheckCircle,
  clock: IconClock,
  "clock-filled": IconClockFilled,
  "document-filled": IconDocumentFilled,
  dollar: IconDollar,
  heart: IconHeart,
  location: IconLocation,
  "price-tag": IconPriceTag,
  "price-tag-filled": IconPriceTagFilled,
  "toyota-x": IconToyotaX,
};

// ─── CardBadge Types ────────────────────────────────────────────────

export type CardBadgeVariant = NonNullable<BadgeProps["variant"]>;

export interface CardBadgeProps {
  /** Badge text content. */
  children: ReactNode;
  /** Card-specific positioning classes (e.g. "absolute top-4 left-4"). */
  className?: string;
  /** Icon component passed directly (when rendering on client with a known component). */
  startIcon?: ReactNode;
  /** Serializable icon name from API — resolved via BADGE_ICON_MAP. */
  startIconName?: CardBadgeIconName;
  /** Badge visual variant — styling comes from the primitive. */
  variant?: CardBadgeVariant;
}

/**
 * CardBadge — shared badge wrapper for all card components.
 *
 * Composes the `@ucmp/ui` Badge primitive directly. The primitive already
 * provides: 24px min-height, pill shape, padding (with ps-1 when
 * data-icon="inline-start" is present), gap, text styling, and variant colors.
 *
 * This wrapper adds:
 * - Icon resolution via BADGE_ICON_MAP (server→client serializable names)
 * - Consistent `data-surface="light"` for surface-aware token switching
 * - Card-specific positioning via `className` (absolute top-* left-*)
 *
 * Accepts either a `startIcon` ReactNode (for client-side icon components)
 * or a `startIconName` string (for server→client serialized icon references).
 */
export function CardBadge({
  children,
  className,
  startIcon,
  startIconName,
  variant = "default",
}: CardBadgeProps) {
  // Resolve icon: prefer explicit ReactNode, fall back to name lookup
  let resolvedIcon: ReactNode = startIcon;
  if (!resolvedIcon && startIconName) {
    const IconComponent = BADGE_ICON_MAP[startIconName];
    if (IconComponent) {
      // Inherit the pill's text color (currentColor) rather than forcing brand
      // red. The line-style badge icons read cleanly when they match the label;
      // forced red on the dark `inverse` pill turned them into low-contrast blobs.
      resolvedIcon = <IconComponent data-icon="inline-start" />;
    }
  }

  return (
    // data-surface="light" is an intentional explicit override — CardBadge always
    // renders on a light surface regardless of the card's inherited surface context.
    // This ensures the badge pill remains readable on any background.
    <Badge className={className} data-surface="light" variant={variant}>
      {resolvedIcon}
      {children}
    </Badge>
  );
}
