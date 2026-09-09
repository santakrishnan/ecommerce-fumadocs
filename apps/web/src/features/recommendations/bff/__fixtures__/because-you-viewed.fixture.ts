import { IMAGE_BASE_URL } from "@config/images";
import { vdp } from "@config/routes/constants";
import type { InventoryUpstreamItem } from "@features/vehicle-detail/bff";
import type { BecauseYouViewedResponse } from "../contracts/because-you-viewed-response.schema";

/**
 * Generate a pseudo-random 17-character VIN (ISO 3779 charset: no I, O, Q).
 */
const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
let vinCounter = 0;
function generateVin(): string {
  vinCounter += 1;
  const seed = Date.now() + vinCounter;
  let vin = "";
  let n = seed;
  for (let i = 0; i < 17; i++) {
    vin += VIN_CHARS[n % VIN_CHARS.length];
    n = Math.trunc(n / VIN_CHARS.length) + (i + 1) * 31;
  }
  return vin;
}

/**
 * Factory function to create vehicle objects with auto-generated ctaLink.
 * The ctaLink is built using the vdp() router function to ensure proper slugification
 * and consistency with the canonical VDP routing rules.
 */
const createVehicle = (data: {
  model: string;
  trim: string;
  year: number;
  price: number;
  mileage: number;
  imageUrl: string;
  imageAlt: string;
  surface: "light" | "dark";
}): InventoryUpstreamItem => {
  const vin = generateVin();
  return {
    id: vin,
    make: "Toyota",
    model: data.model,
    year: data.year,
    trim: data.trim,
    price: data.price,
    mileage: data.mileage,
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    ctaLink: vdp({
      make: "Toyota",
      model: data.model,
      trim: data.trim,
      year: data.year,
      vin,
    }),
    surface: data.surface,
    vin,
  };
};

const VEHICLES: InventoryUpstreamItem[] = [
  createVehicle({
    model: "Camry",
    trim: "XSE",
    year: 2024,
    price: 31_490,
    mileage: 12_000,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card2.png`,
    imageAlt: "2024 Toyota Camry XSE",
    surface: "light",
  }),
  createVehicle({
    model: "RAV4",
    trim: "Adventure",
    year: 2023,
    price: 38_200,
    mileage: 24_500,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card3.png`,
    imageAlt: "2023 Toyota RAV4 Adventure",
    surface: "light",
  }),
  createVehicle({
    model: "Highlander",
    trim: "Hybrid XSE",
    year: 2024,
    price: 48_900,
    mileage: 8400,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card1.png`,
    imageAlt: "2024 Toyota Highlander Hybrid XSE",
    surface: "dark",
  }),
  createVehicle({
    model: "Tacoma",
    trim: "TRD Off Road",
    year: 2023,
    price: 44_150,
    mileage: 18_750,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card4.png`,
    imageAlt: "2023 Toyota Tacoma TRD Off Road",
    surface: "dark",
  }),
  createVehicle({
    model: "Prius",
    trim: "XLE",
    year: 2024,
    price: 34_280,
    mileage: 5100,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card5.png`,
    imageAlt: "2024 Toyota Prius XLE",
    surface: "light",
  }),
  createVehicle({
    model: "4Runner",
    trim: "TRD Pro",
    year: 2023,
    price: 56_700,
    mileage: 11_200,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card6.png`,
    imageAlt: "2023 Toyota 4Runner TRD Pro",
    surface: "dark",
  }),
];

/** Raw upstream shape — used to test upstream response parsing. */
export const BECAUSE_YOU_VIEWED_UPSTREAM_FIXTURE: { results: InventoryUpstreamItem[] } = {
  results: VEHICLES,
};

/** Success response — results with pagination. */
export const BECAUSE_YOU_VIEWED_SUCCESS_FIXTURE: BecauseYouViewedResponse = {
  results: VEHICLES,
  pagination: { nextCursor: "cursor-abc", hasNext: true },
};

/** Empty response — no results. */
export const BECAUSE_YOU_VIEWED_EMPTY_FIXTURE: BecauseYouViewedResponse = {
  results: [],
  pagination: { hasNext: false },
};
