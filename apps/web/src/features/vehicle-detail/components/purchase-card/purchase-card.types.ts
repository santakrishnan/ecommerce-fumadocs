import type { CardBadgeIconName } from "@shared/components/card";
import type React from "react";

// ─── Payment State Discriminated Union ──────────────────────────────

/** S1: No estimate, no offer. */
export interface PurchaseStateDefault {
  kind: "default";
}

/** S2: Estimated payment available. */
export interface PurchaseStateEstimated {
  /** Down payment amount (e.g. 3500). */
  downPayment: number;
  kind: "estimated";
  /** Monthly payment amount (e.g. 456.97). */
  monthlyPayment: number;
}

/** S3: Active (non-expired) prequal offer. */
export interface PurchaseStateActive {
  /** APR percentage (e.g. 3.29). */
  apr: number;
  /** Human-readable expiry (e.g. "Expires in 5d, 18h"). */
  expiresIn: string;
  kind: "active";
  /** Monthly payment amount (e.g. 297). */
  monthlyPayment: number;
  /** Loan term in months (e.g. 60). */
  termMonths: number;
}

/** S4: Expired prequal offer. */
export interface PurchaseStateExpired {
  kind: "expired";
}

export type PurchasePaymentState =
  | PurchaseStateDefault
  | PurchaseStateEstimated
  | PurchaseStateActive
  | PurchaseStateExpired;

// ─── Vehicle & Certification ────────────────────────────────────────

/** Certification tier — used to derive badge label and icon when not provided explicitly. */
export type PurchaseCardCertification = "gold" | "silver" | false;

/**
 * Vehicle data accepted by PurchaseCard.
 * Structurally compatible with `VehicleDetailData` — no cross-feature import needed.
 */
export interface PurchaseCardVehicle {
  certification: PurchaseCardCertification;
  make: string;
  mileage: number;
  model: string;
  msrp: number;
  price: number;
  trim: string;
  vin: string;
  year: number;
}

/** Dealer data for the availability block. */
export interface PurchaseCardDealer {
  address: string;
  dealerCode: string;
  mapThumbnailUrl?: string;
  name: string;
}

// ─── Component Props ────────────────────────────────────────────────

export interface PurchaseCardUpperProps {
  /**
   * Optional slot for custom availability content.
   * When provided, replaces the default dealer name/address/map block.
   * Use this to inject a DealerInfoDialog trigger or other rich content.
   */
  availabilitySlot?: React.ReactNode;
  /** Badge icon name from the shared icon map. Derived from vehicle certification when omitted. */
  badgeIconName?: CardBadgeIconName;
  /** Badge label (e.g. "Below market"). Derived from vehicle certification when omitted. */
  badgeLabel?: string;
  /** Dealer data for the availability block. */
  dealer: PurchaseCardDealer;
  /**
   * Whether to render the sticky CTA (IntersectionObserver + portal).
   * Should be `true` only for the mobile/tablet instance where the card scrolls
   * out of view. Desktop uses a sticky rail so the inline button is always visible.
   * @default true
   */
  enableStickyCta?: boolean;
  /** Presentational save toggle state (behavior owned by PEDX01-2037). */
  isSaved?: boolean;
  /** Optional callback for the ⓘ info button. */
  onInfoClick?: () => void;
  /** Callback when save toggle is pressed (presentational — parent owns logic). */
  onSaveToggle?: () => void;
  /** Payment/prequal state — drives the payment block and CTA label. Defaults to `{ kind: "default" }`. */
  paymentState?: PurchasePaymentState;
  /** Optional CSS view transition name for shared-element morphing on the title. */
  titleTransitionName?: string;
  /**
   * Vehicle data object. The component derives title, salePrice,
   * msrp, mileage, vin, year, and certification internally — no mapping needed
   * at the call site.
   */
  vehicle: PurchaseCardVehicle;
}
