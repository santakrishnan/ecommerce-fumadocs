import type { Vehicle } from "@shared/components/inventory-card";
import { INVENTORY_CARD_IMAGE_SURFACES } from "../../../search/data/inventory-card-image-surface";
import type { InventoryCardResponse } from "../contracts/search-response.schema";

/**
 * Deterministic vehicle fixture factory.
 *
 * Generates 150 unique vehicles using a seeded PRNG (mulberry32) —
 * same seed produces identical output on every run. Prevents flaky tests
 * and guarantees enough records to exercise pagination
 * (7 pages at 24/page = 168 slots, 150 records).
 *
 * Uses the 16 Figma-exported car images cycled across all records.
 */

/** Available trim levels — matches the Figma "Show All Results" design. */
const TRIMS = [
  "Hybrid XLE",
  "Hybrid LE",
  "Hybrid Limited",
  "Hybrid XSE",
  "Hybrid Bronze Edition",
] as const;

/** Years to cycle through — recent model years. */
const YEARS = [2022, 2023, 2024, 2025] as const;

/** Total number of available card images (from Figma export). */
const IMAGE_COUNT = 16;

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Produces deterministic values for a given seed — same seed = same sequence.
 */
function seededRandom(seed: number): () => number {
  // biome-ignore lint/suspicious/noBitwiseOperators: intentional — mulberry32 PRNG requires bitwise ops
  let s = seed | 0;
  return () => {
    // biome-ignore lint/suspicious/noBitwiseOperators: intentional — mulberry32 PRNG requires bitwise ops
    s = (s + 0x6d_2b_79_f5) | 0;
    // biome-ignore lint/suspicious/noBitwiseOperators: intentional — mulberry32 PRNG requires bitwise ops
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    // biome-ignore lint/suspicious/noBitwiseOperators: intentional — mulberry32 PRNG requires bitwise ops
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    // biome-ignore lint/suspicious/noBitwiseOperators: intentional — mulberry32 PRNG requires bitwise ops
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Generates a deterministic set of vehicle fixtures.
 *
 * @param count - Number of vehicles to generate (default: 150).
 * @param seed - Seed for deterministic randomization (default: 42).
 * @returns Array of Vehicle objects with realistic data distribution.
 *
 * @example
 * ```ts
 * const vehicles = generateVehicleFixtures(); // 150 deterministic records
 * const smallSet = generateVehicleFixtures(20); // 20 records for unit tests
 * ```
 */
export function generateVehicleFixtures(count = 150, seed = 42): Vehicle[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const imageIndex = (i % IMAGE_COUNT) + 1;
    const imageNum = imageIndex.toString().padStart(2, "0");
    const trim = TRIMS[i % TRIMS.length] as (typeof TRIMS)[number];
    const year = YEARS[i % YEARS.length] as (typeof YEARS)[number];
    const surfaceValue = INVENTORY_CARD_IMAGE_SURFACES[i % IMAGE_COUNT] as "light" | "dark";

    // Deterministic price: base + variation from seeded random
    // Range: ~$28,000 – $52,000 (realistic for Highlander Hybrids)
    const basePrice = 28_000;
    const priceVariation = Math.floor(random() * 24_000);
    const price = basePrice + priceVariation;

    // Deterministic mileage: inversely correlated with year (newer = fewer miles)
    // 2025: 0–15k, 2024: 2k–25k, 2023: 8k–45k, 2022: 15k–60k
    const yearOffset = 2025 - year;
    const baseMileage = yearOffset * 8000;
    const mileageVariation = Math.floor(random() * (15_000 + yearOffset * 5000));
    const mileage = baseMileage + mileageVariation;

    // Add sale pricing to a subset of vehicles only.
    const hasOriginalPrice = i % 5 === 0;
    const originalPrice = hasOriginalPrice ? price + 1000 + Math.floor(random() * 4000) : undefined;

    return {
      id: `v-${(i + 1).toString().padStart(3, "0")}`,
      make: "Toyota",
      model: "Highlander",
      year,
      trim,
      price,
      mileage,
      imageUrl: `/inventory-card/inventory-card-${imageNum}.png`,
      originalPrice,
      surface: surfaceValue,
    } satisfies Vehicle;
  });
}

/** Pre-generated fixture set — 150 deterministic vehicles. */
export const VEHICLE_FIXTURES = generateVehicleFixtures();

// ---------------------------------------------------------------------------
// SDK InventoryCard fixture (nested wire format)
// ---------------------------------------------------------------------------

/**
 * Generates deterministic inventory card fixtures in the SDK `InventoryCard`
 * wire format. Mirrors the same seeded price/mileage distribution as
 * {@link generateVehicleFixtures} so the BFF mock produces consistent results
 * when the mapper transforms these records into {@link Vehicle} objects.
 *
 * ISO 3779-format mock VINs (`1MFCK…`) are structurally valid so
 * `ROUTES.vdpSafe()` produces real VDP hrefs in development.
 */
export function generateInventoryCardFixtures(count = 150, seed = 42): InventoryCardResponse[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const imageIndex = (i % IMAGE_COUNT) + 1;
    const imageNum = imageIndex.toString().padStart(2, "0");
    const trim = TRIMS[i % TRIMS.length] as (typeof TRIMS)[number];
    const year = YEARS[i % YEARS.length] as (typeof YEARS)[number];

    const basePrice = 28_000;
    const priceVariation = Math.floor(random() * 24_000);
    const listPrice = basePrice + priceVariation;

    const yearOffset = 2025 - year;
    const baseMileage = yearOffset * 8000;
    const mileageVariation = Math.floor(random() * (15_000 + yearOffset * 5000));
    const mileage = baseMileage + mileageVariation;

    const hasOriginalPrice = i % 5 === 0;
    const msrp = hasOriginalPrice ? listPrice + 1000 + Math.floor(random() * 4000) : undefined;

    // ISO 3779-format mock VIN: fixed prefix + zero-padded 12-digit index.
    const vin = `1MFCK${(i + 1).toString().padStart(12, "0")}`;

    return {
      vin,
      vehicleId: i + 1,
      vehicleInfo: {
        year,
        make: "Toyota",
        model: "Highlander",
        trim,
      },
      dealerInfo: {
        dealerCode: "TYT001",
        dealerName: "Toyota Dealer",
      },
      pricing: {
        listPrice,
        ...(msrp !== undefined && { msrp }),
      },
      status: {
        mileage,
        vehicleStatus: "Available",
      },
      media: {
        photos: [{ url: `/inventory-card/inventory-card-${imageNum}.png`, displayOrder: 1 }],
      },
    } satisfies InventoryCardResponse;
  });
}

/** Pre-generated inventory card fixture set — 150 deterministic records in SDK InventoryCard format. */
export const INVENTORY_CARD_FIXTURES = generateInventoryCardFixtures();
