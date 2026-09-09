/**
 * VDP vehicle detail fixtures.
 *
 * Provides deterministic vehicle data for the detail page.
 * Each variant covers a different certification/personalization scenario.
 */

import { IMAGE_BASE_URL } from "@config/images";
import type { HotspotData } from "@features/vehicle-detail";

export interface VehicleDetailData {
  certification: "gold" | "silver" | false;
  /** Condition hotspots (scratches, dents) positioned on the hero image */
  conditionHotspots?: HotspotData[];
  description: string;
  /** Hex colour for exterior swatch (e.g. "#ffffff"). */
  exteriorColor: string;
  /** Display name for the exterior colour (e.g. "Midnight Black Metallic"). */
  exteriorColorFamily: string;
  heroImageUrl: string;
  /** Hex colour for interior swatch (e.g. "#000000"). */
  interiorColor: string;
  /** Display name for the interior colour (e.g. "Black Midnight"). */
  interiorColorFamily: string;
  /** Interior material type (e.g. "Leather"). */
  interiorMaterial: string;
  /** URL of a texture image for the interior swatch fallback. */
  interiorTextureImage: string;
  /** Key features hotspots positioned on the hero image */
  keyFeaturesHotspots?: HotspotData[];
  make: string;
  mileage: number;
  model: string;
  msrp: number;
  /** Dealer-provided photo URLs. Empty array = no photos uploaded. */
  photos: string[];
  price: number;
  trim: string;
  vin: string;
  year: number;
}

const DEFAULTS: VehicleDetailData = {
  vin: "1234567890ABCDEFG",
  year: 2023,
  make: "Toyota",
  model: "Highlander",
  trim: "XLE",
  price: 29_245,
  msrp: 30_245,
  mileage: 36_435,
  exteriorColor: "#1a1a1a",
  exteriorColorFamily: "Midnight Black Metallic",
  interiorColor: "#d4a574",
  interiorColorFamily: "Harvest Beige",
  interiorMaterial: "Fabric",
  interiorTextureImage: `${IMAGE_BASE_URL}/images/vdp/Ellipse.png`,
  heroImageUrl: "/images/vdp/vdp-hero.png",
  photos: ["/images/vdp/vdp-hero.png"],
  certification: false,
  description:
    "This Highlander XLE has low mileage and a clean Carfax report with no accidents. It features all-wheel drive, heated seats, and Apple CarPlay.",
  keyFeaturesHotspots: [
    { x: 33, y: 45, label: "LED Daytime Running Lights", section: "exterior" },
    { x: 30, y: 20, label: "Panoramic Moonroof", section: "exterior" },
    { x: 22, y: 70, label: "19-inch Alloy Wheels", section: "exterior" },
    { x: 16, y: 30, label: "Tinted Windows", section: "exterior" },
    { x: 35, y: 40, label: "Power Windows", section: "interior" },
    { x: 70, y: 55, label: "Leather Trim Seats", section: "interior" },
  ],
  conditionHotspots: [
    { x: 45, y: 60, label: "Minor scratch on front bumper", section: "exterior" },
    { x: 18, y: 45, label: "Small dent on passenger door", section: "exterior" },
    { x: 70, y: 35, label: "Wear on passenger seat", section: "interior" },
  ],
};

/**
 * Generate a VDP fixture with optional overrides.
 *
 * @example
 * ```ts
 * const gold = generateVdpFixture({ certification: "gold" });
 * const personalized = generateVdpFixture({ personalized: true });
 * ```
 */
export function generateVdpFixture(overrides?: Partial<VehicleDetailData>): VehicleDetailData {
  return { ...DEFAULTS, ...overrides };
}

/** Gold Certified variant */
export const VDP_FIXTURE_GOLD = generateVdpFixture({
  vin: "GOLD567890ABCDEFG",
  certification: "gold",
  trim: "Hybrid Limited",
  price: 30_775,
  msrp: 31_775,
  description:
    "It has everything you’re looking for, including plenty of space inside, while still compact enough to be perfect for getting around Brooklyn.\nThe other thing to note is that it’s a one-owner vehicle with Toyota Gold Certification, which means it comes with added warranty coverage.",
});

/** Silver Certified variant */
export const VDP_FIXTURE_SILVER = generateVdpFixture({
  vin: "SLVR567890ABCDEFG",
  certification: "silver",
  trim: "Hybrid XLE",
  price: 28_990,
  msrp: 30_100,
  description:
    "This Highlander Hybrid XLE is Toyota Silver Certified — it passed our 136-point inspection and meets Toyota's certified quality standard, backed by warranty coverage.",
});

/** Uncertified variant (no badge) */
export const VDP_FIXTURE_UNCERTIFIED = generateVdpFixture({
  vin: "NONE567890ABCDEFG",
  certification: false,
  trim: "LE",
  price: 26_500,
  msrp: 26_500,
});

/** Minimal data variant (fewest optional fields) */
export const VDP_FIXTURE_MINIMAL = generateVdpFixture({
  vin: "MINI567890ABCDEFG",
  certification: false,
  trim: "LE",
  price: 24_900,
  msrp: 24_900,
  mileage: 58_200,
  description: "A well-maintained Highlander with standard features.",
});

/** No-photos variant — dealer has not uploaded any images */
export const VDP_FIXTURE_NO_PHOTOS = generateVdpFixture({
  vin: "5TDBZRFH7NS000001",
  certification: false,
  photos: [],
  heroImageUrl: "/images/vehicles/placeholder/illustrative-hero.png",
  exteriorColor: "#CE1E2D",
  exteriorColorFamily: "Ruby Red Flare Pearl",
  interiorColor: "#5c3317",
  interiorColorFamily: "Brown",
  interiorMaterial: "SofTex",
  interiorTextureImage: `${IMAGE_BASE_URL}/images/vdp/Ellipse.png`,
  description:
    "This Highlander XLE has low mileage and a clean Carfax report with no accidents. It features all-wheel drive, heated seats, and Apple CarPlay.",
});
