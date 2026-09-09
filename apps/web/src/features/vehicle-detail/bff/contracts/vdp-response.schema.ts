import type { VehicleDetail } from "@ucmp/sdk-search-api";
import { z } from "zod";
import type { VdpDealer } from "./dealer-detail.schema";
import type { OriginationResponse } from "./origination.schema";

// ─── VDP-specific enrichments ────────────────────────────────────────────────

const vdpCertificationModalValueSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("check"),
  }),
]);

export type VdpCertificationModalValue = z.infer<typeof vdpCertificationModalValueSchema>;

const vdpCertificationModalRowSchema = z.object({
  label: z.string(),
  value: vdpCertificationModalValueSchema,
});

export type VdpCertificationModalRow = z.infer<typeof vdpCertificationModalRowSchema>;

export const vdpCertificationModalSchema = z.object({
  description: z.string(),
  rows: z.array(vdpCertificationModalRowSchema),
  title: z.string(),
});

export type VdpCertificationModal = z.infer<typeof vdpCertificationModalSchema>;

export const vdpCertificationSchema = z.object({
  badgeUrl: z.string(),
  description: z.string(),
  headline: z.string(),
  modal: vdpCertificationModalSchema,
  inspectionPoints: z.number().int().positive(),
  tier: z.enum(["gold", "silver"]),
});

export type VdpCertification = z.infer<typeof vdpCertificationSchema>;

export interface VdpComputed {
  comparisonProfile?: string;
  effectivePrice?: number;
  horsepower?: number;
  seating?: number;
}

// ─── Hero & AI-generated content ─────────────────────────────────────────────

/** AI-generated narrative for this vehicle + visitor. */
export interface VdpAiContent {
  generatedAt?: string;
  generatedBy?: string;
  paragraphs: string[];
}

// ─── Vehicle Data ────────────────────────────────────────────────────────────
// Extends VehicleDetail with VDP-specific fields not yet in the SDK.

export interface VdpPricingCard {
  amountBelowMarketValue: number;
  averagePrice: number;
  marketValuePercentage: number;
  nearbyComparedVehiclesCount: number;
  priceRangeEnd: number;
  priceRangeStart: number;
  thisCarPrice: number;
  valueDirection: "above" | "below";
}

export interface VdpVehicleData extends VehicleDetail {
  aiContent?: VdpAiContent | null;
  belowMarket?: boolean | null;
  certification?: VdpCertification | null;
  computed?: VdpComputed;
  soldAt?: string | null;
}

// ─── Similar Vehicles ────────────────────────────────────────────────────────

export interface VdpSimilarVehicles {
  results: Array<{
    vin: string;
    make: string;
    model: string;
    year: number;
    trim?: string;
    price: number;
    mileage: number;
    imageUrl: string;
    imageAlt: string;
    ctaLink: string;
  }>;
  totalCount: number;
}

// ─── Marketing Content ───────────────────────────────────────────────────────

export interface VdpMarketingContent {
  benefits: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  heading: string;
  image: {
    src: string;
    alt: string;
  };
}

// ─── FAQ Content ────────────────────────────────────────────────────────────

export interface VdpFaqQuestion {
  id: string;
  question: string;
}

export interface VdpFaq {
  heading: string;
  id: string;
  questions: VdpFaqQuestion[];
}

// ─── Detail Card Images ─────────────────────────────────────────────────────

export interface VdpVehicleImage {
  badge?: string;
  imageUrl: string;
  label: string;
  subLabel?: string;
}

export interface VdpVehicleImages {
  exterior: VdpVehicleImage;
  interior: VdpVehicleImage;
  wheels: VdpVehicleImage;
}

// ─── Full VDP Data ───────────────────────────────────────────────────────────

export interface VdpData {
  dealer: VdpDealer | null;
  faq: VdpFaq | null;
  marketing: VdpMarketingContent | null;
  origination: OriginationResponse;
  pricingCard: VdpPricingCard | null;
  similar: VdpSimilarVehicles;
  /**
   * BFF-relative URL for the 360° manifest proxy for this VIN.
   * The proxy may return 404 when Car-Cutter has no 360° data available.
   * Null only when the backend does not provide / disables the 360° integration.
   */
  threeSixtyManifestUrl: string | null;
  vehicle: VdpVehicleData | null;
  vehicleImages?: VdpVehicleImages;
}

// ─── Full API Response ───────────────────────────────────────────────────────

export interface VdpApiResponse {
  data: VdpData;
  meta: {
    traceId: string;
    timestamp: string;
  };
}
