import soldHeroTablet from "@public/images/vdp/sold-hero.png";
import soldHeroDesktop from "@public/images/vdp/sold-hero-desktop.png";
import soldHeroMobile from "@public/images/vdp/sold-hero-mobile.png";
import { normalizeImageUrl } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing/resolve-display-price";
import type { VdpApiResponse } from "../bff/contracts/vdp-response.schema";
import type {
  PurchaseCardCertification,
  PurchaseCardDealer,
  PurchaseCardVehicle,
  PurchasePaymentState,
} from "../components/purchase-card";
import type { StatusCardDealer, StatusCardVehicle } from "../components/sold-card";
import type { VdpCertificationTier } from "../flags/vdp-flags.constants";
import { formatExpiresIn } from "../lib/format-expires-in";
import type { DealerInfoData, Origination } from "../types";

/**
 * Sold hero images — static imports give compile-time path validation.
 * `.src` is used because StatusHeroCard renders a native <picture>/<img>
 * (not next/image) and requires plain string URLs.
 */
const SOLD_HERO_IMAGE_MOBILE = soldHeroMobile.src;
const SOLD_HERO_IMAGE_TABLET = soldHeroTablet.src;
const SOLD_HERO_IMAGE_DESKTOP = soldHeroDesktop.src;

/** Map the origination (payment) source to the card's discriminated payment union. */
function toPaymentState(origination: Origination): PurchasePaymentState {
  switch (origination.kind) {
    case "estimate":
      return {
        kind: "estimated",
        monthlyPayment: origination.estimatedMonthly,
        downPayment: origination.downPayment,
      };
    case "offer":
      return {
        kind: "active",
        monthlyPayment: origination.monthly,
        apr: origination.apr,
        termMonths: origination.termMonths,
        expiresIn: formatExpiresIn(origination.expiresAt),
      };
    case "expired":
      return { kind: "expired" };
    default:
      return { kind: "default" };
  }
}

/** Cookie/flag tier → the card's certification literal. */
function toCardCertification(tier: VdpCertificationTier): PurchaseCardCertification {
  return tier === "false" ? false : tier;
}

// ─── Active Vehicle Card Inputs ─────────────────────────────────────────────

export interface PurchaseCardFromApiInputs {
  /** Override badge icon — derived from belowMarket + certification. */
  badgeIconName?: "price-tag-filled";
  /** Override badge label — derived from belowMarket + certification. */
  badgeLabel?: string;
  dealer: PurchaseCardDealer;
  /** Full dealer data for the DealerInfoDialog (from API response). */
  dealerInfo: DealerInfoData;
  paymentState: PurchasePaymentState;
  vehicle: PurchaseCardVehicle;
}

/** Extract dealer address and map thumbnail from the API response. */
function extractDealerCard(dealer: VdpApiResponse["data"]["dealer"]): {
  address: string;
  mapThumbnailUrl: string;
} {
  if (dealer?.extended) {
    const ext = dealer.extended;
    const cityLine =
      ext.address.city && ext.address.state
        ? `${ext.address.city}, ${ext.address.state} ${ext.address.zip}`
        : ext.address.zip;
    const address = [ext.address.line1, cityLine].filter(Boolean).join(", ");
    const thumbImage = ext.images?.find((img) => img.type === "map-thumbnail");
    const mapThumbnailUrl = thumbImage ? normalizeImageUrl(thumbImage.url, "") : "";
    return { address, mapThumbnailUrl };
  }
  if (dealer) {
    return {
      address: `${dealer.city}, ${dealer.state} ${dealer.zipCode}`,
      mapThumbnailUrl: "",
    };
  }
  return { address: "", mapThumbnailUrl: "" };
}

/** Derive badge label and icon from vehicle data and certification. */
function deriveBadge(
  belowMarket: boolean,
  certTier: PurchaseCardCertification
): { badgeIconName?: "price-tag-filled"; badgeLabel?: string } {
  if (certTier === "gold") {
    return { badgeLabel: "Gold Certified" };
  }
  if (certTier === "silver") {
    return { badgeLabel: "Silver Certified" };
  }
  if (belowMarket) {
    return { badgeLabel: "Below market", badgeIconName: "price-tag-filled" };
  }
  return {};
}

/** Build DealerInfoData from the API response for DealerInfoDialog. */
function buildDealerInfo(dealer: VdpApiResponse["data"]["dealer"]): DealerInfoData {
  return {
    dealerCode: dealer?.dealerCode ?? "",
    name: dealer?.dealerName ?? "",
    address: dealer?.extended?.address ?? {
      line1: "",
      city: dealer?.city ?? "",
      state: dealer?.state ?? "",
      zip: dealer?.zipCode ?? "",
    },
    phone: dealer?.extended?.phone,
    rating: dealer?.extended?.rating,
    hours: dealer?.extended?.hours ?? { statusText: "", isOpenNow: false, weekly: [] },
    images: dealer?.extended?.images ?? [],
    testDrive: dealer?.extended?.testDrive ?? null,
  };
}

/**
 * Map a BFF `VdpApiResponse` to the inputs for `PurchaseCard` (active vehicles).
 * Pulls vehicle/pricing/dealer data directly from the API response shape.
 */
export function toPurchaseCardFromApi(
  response: VdpApiResponse,
  certification: VdpCertificationTier
): PurchaseCardFromApiInputs {
  const { vehicle, dealer, origination } = response.data;
  const certTier = toCardCertification(certification);
  const { address: dealerAddress, mapThumbnailUrl } = extractDealerCard(dealer);
  const { badgeLabel, badgeIconName } = deriveBadge(vehicle?.belowMarket === true, certTier);

  // Price precedence: resolved by shared utility (effectivePrice → sellingPrice → listPrice).
  const price = resolveDisplayPrice({
    effectivePrice: vehicle?.computed?.effectivePrice,
    sellingPrice: vehicle?.pricing.sellingPrice,
    listPrice: vehicle?.pricing.listPrice,
  });

  return {
    badgeLabel,
    badgeIconName,
    vehicle: {
      certification: certTier,
      make: vehicle?.vehicleInfo.make ?? "",
      model: vehicle?.vehicleInfo.model ?? "",
      trim: vehicle?.vehicleInfo.trim ?? "",
      year: vehicle?.vehicleInfo.year ?? 0,
      mileage: vehicle?.status.mileage ?? 0,
      vin: vehicle?.vin ?? "",
      price,
      msrp: vehicle?.pricing.listPrice ?? 0,
    },
    dealer: {
      dealerCode: dealer?.dealerCode ?? "",
      name: dealer?.dealerName ?? "",
      address: dealerAddress,
      mapThumbnailUrl,
    },
    dealerInfo: buildDealerInfo(dealer),
    paymentState: toPaymentState(origination),
  };
}

// ─── Sold Card Inputs ───────────────────────────────────────────────────────

export interface SoldCardFromApiInputs {
  dealer: StatusCardDealer;
  /** Static sold hero image — mobile (default). */
  heroImageUrl: string;
  /** Static sold hero image — desktop. */
  heroImageUrlDesktop: string;
  /** Static sold hero image — tablet. */
  heroImageUrlTablet: string;
  soldDate: string;
  vehicle: StatusCardVehicle;
}

/**
 * Map a BFF `VdpApiResponse` to the inputs for `StatusCard`.
 * Only call when you've already determined the vehicle is sold.
 */
export function toSoldCardFromApi(response: VdpApiResponse): SoldCardFromApiInputs {
  const { vehicle, dealer } = response.data;

  // Always use the static car keys image for the sold hero
  const heroImageUrl = SOLD_HERO_IMAGE_MOBILE;

  return {
    vehicle: {
      make: vehicle?.vehicleInfo.make ?? "",
      model: vehicle?.vehicleInfo.model ?? "",
      trim: vehicle?.vehicleInfo.trim ?? "",
      year: vehicle?.vehicleInfo.year ?? 0,
      bodyStyle: vehicle?.vehicleInfo.bodyStyle ?? "",
    },
    dealer: {
      name: dealer?.dealerName ?? "",
    },
    heroImageUrl,
    heroImageUrlDesktop: SOLD_HERO_IMAGE_DESKTOP,
    heroImageUrlTablet: SOLD_HERO_IMAGE_TABLET,
    soldDate: vehicle?.soldAt ?? new Date().toISOString(),
  };
}

// ─── State Detection ────────────────────────────────────────────────────────

export type PurchaseCardState = "active" | "sold";

/** Determine whether the vehicle in the API response is sold. */
export function detectCardState(response: VdpApiResponse): PurchaseCardState {
  const vehicle = response.data.vehicle;
  if (!vehicle) {
    return "active";
  }

  const status = vehicle.status.vehicleStatus;
  if (status === "Sold" || status === "sold") {
    return "sold";
  }

  return "active";
}
