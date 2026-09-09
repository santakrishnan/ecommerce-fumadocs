import type { CardBadgeIconName, CardBadgeProps } from "@shared/components/card";
import type { DropdownMenuItemProps } from "@ucmp/ui";
import type { IconProps } from "@ucmp/ui/icons";
import type React from "react";

// ─── Badge ──────────────────────────────────────────────────────────────────

export interface WatchlistBadgeData extends Omit<CardBadgeProps, "children" | "startIconName"> {
  /** Icon name resolved via CardBadge's icon map (inherits currentColor). */
  iconName?: CardBadgeIconName;
  /** Badge label text (e.g. "$1000 price drop"). */
  label: string;
}

// ─── Payment (discriminated union) ──────────────────────────────────────────

export interface PaymentEstimate {
  /** Down payment amount. */
  down: number;
  /** Monthly payment amount. */
  monthly: number;
  type: "estimate";
}

export interface PaymentOffer {
  /** APR percentage (e.g. 5.99). */
  apr: number;
  /** Offer expiry text (e.g. "Expires in 5d, 18h"). */
  expiry: string;
  /** Monthly payment amount. */
  monthly: number;
  /** Loan term in months (e.g. 60). */
  termMonths: number;
  type: "offer";
}

export type WatchlistPayment = PaymentEstimate | PaymentOffer;

// ─── Sold state ─────────────────────────────────────────────────────────────

export interface SoldInfo {
  /** Date the vehicle was sold (e.g. "March 24, 2026"). */
  date: string;
  /** Dealership name (e.g. "Toyota of Bay Ridge"). */
  dealer: string;
}

// ─── Overflow Menu ──────────────────────────────────────────────────────────

export interface OverflowMenuItem {
  /** Optional leading icon component. */
  icon?: React.ComponentType<IconProps>;
  /** Unique key for the item. */
  key: string;
  /** Display label. */
  label: string;
  /** Called when the item is selected. No-op by default. */
  onSelect?: () => void;
  /** Visual variant — derived from DropdownMenuItem's supported variants. */
  variant?: DropdownMenuItemProps["variant"];
}

// ─── WatchlistCard Props ────────────────────────────────────────────────────

export interface WatchlistCardProps {
  /** Optional status badge data (top-left on image). */
  badge?: WatchlistBadgeData;
  /** Optional feature tag label (e.g. "Adaptive cruise control"). */
  featureTag?: string;
  /** Image alt text. */
  imageAlt: string;
  /** Image source URL. */
  imageSrc: string;
  /** Vehicle make (e.g. "TOYOTA"). */
  make: string;
  /** Vehicle mileage in miles. */
  mileage: number;
  /** Vehicle model (e.g. "RAV4"). */
  model: string;
  /** Saved private note — rendered inside the card, below the footer. */
  note?: string;
  /** Original (strikethrough) price — shown only when > price. */
  originalPrice?: number;
  /** Overflow menu items (actions are no-ops or provided via props). */
  overflowItems?: OverflowMenuItem[];
  /** Payment data — discriminated by type: "estimate" or "offer". */
  payment?: WatchlistPayment;
  /** Current price. */
  price: number;
  /** Sold state — when present, card renders in sold/dimmed variant. */
  sold?: SoldInfo;
  /** Vehicle trim (e.g. "XSE"). */
  trim?: string;
  /** Vehicle VIN — used for note persistence. */
  vin?: string;
  /** Number of users watching this vehicle. */
  watchingCount?: number;
  /** Vehicle year. */
  year: number;
}
