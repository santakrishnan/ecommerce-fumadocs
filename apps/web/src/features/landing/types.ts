import type { CardBadgeIconName } from "@shared/components/card";

// ─── Dealer Offer Card Types (Story 3.5.1) ───

/** Badge variant for dealer offer cards */
export type DealerOfferBadgeVariant = "red" | "white";

/** Icon type for dealer offer cards */
export type DealerOfferIconType = "location" | "ai";

/** Text theme for dealer offer card content */
export type DealerOfferTextTheme = "dark" | "light";

/** Badge configuration — if present, badge is shown */
export interface DealerOfferBadge {
  /** Serializable icon name resolved via BADGE_ICON_MAP inside CardBadge. */
  iconName?: CardBadgeIconName;
  /** Badge label text (e.g. "Featured", "AI Match") */
  label: string;
  /** Visual variant — red for featured, white for AI match */
  variant: DealerOfferBadgeVariant;
}

/** Personalization icon — if present, icon row is shown */
export interface DealerOfferIcon {
  /** Icon type — location pin or AI sparkle */
  type: DealerOfferIconType;
}

/**
 * Data shape for a local dealer offer card.
 * V1: static mock data. V2: will be validated via Zod at the service layer.
 */
export interface DealerOfferData {
  /** Optional badge overlay — shown when present */
  badge?: DealerOfferBadge;
  /** Optional personalization icon — shown when present */
  icon?: DealerOfferIcon;
  /** Unique dealer identifier used for routing */
  id: string;
  /** Alt text for the card background image */
  imageAlt: string;
  /** Card background image source URL */
  imageSrc: string;
  /** Dealer name displayed as the eyebrow */
  name: string;
  /** Offer headline displayed as the card heading (`<h3>`) */
  offerHeadline: string;
  /** Optional personalization text — shown when present */
  personalization?: string;
  /** Text color theme — "dark" for black text, "light" for white text. Defaults to "light". */
  textTheme?: DealerOfferTextTheme;
}

// ─── Category Card Types ───

/**
 * Data shape for a vehicle category card.
 */
export interface CategoryCardData {
  /** Category description text */
  description: string;
  /** Alt text for the vehicle image */
  imageAlt: string;
  /** Vehicle image URL (transparent PNG) */
  imageUrl: string;
  /** Category name (e.g. "CARS & MINIVANS", "TRUCKS") */
  name: string;
  /** Navigation URL for the "Shop now" button */
  shopUrl: string;
}
