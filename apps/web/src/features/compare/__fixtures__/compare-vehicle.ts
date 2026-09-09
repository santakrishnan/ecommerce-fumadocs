import type { Vehicle } from "@shared/components/inventory-card";

/**
 * Fixtures for the CompareVehicleCard feature.
 *
 * All fixtures reuse the shared `Vehicle` shape from `@shared/components/inventory-card`
 * (no redefined vehicle type). They are referenced from co-located unit/property tests
 * and Storybook stories — do not inline mock data in test files.
 */

/**
 * Happy-path RAV4 XSE vehicle.
 *
 * Full make/model/trim so the composed title reads `TOYOTA RAV4 XSE` and the
 * metadata row reads `{year} • {formatMileage(mileage)}`.
 */
export const rav4Xse: Vehicle = {
  id: "compare-rav4-xse",
  make: "TOYOTA",
  model: "RAV4",
  trim: "XSE",
  year: 2023,
  mileage: 36_435,
  price: 38_995,
  imageUrl: "/compare-card/compare-card-01.png",
};

/**
 * No-trim variant — `trim` is absent so the title composes from make/model only
 * (`TOYOTA RAV4`) with no trailing separator.
 */
export const rav4XseNoTrim: Vehicle = {
  ...rav4Xse,
  id: "compare-rav4-no-trim",
  trim: undefined,
  imageUrl: "/compare-card/compare-card-02.png",
};

/**
 * Missing-image variant — `imageUrl` is empty so the card must resolve the shared
 * inventory fallback source while still rendering title and metadata.
 */
export const rav4XseNoImage: Vehicle = {
  ...rav4Xse,
  id: "compare-rav4-no-image",
  imageUrl: "",
};

/**
 * Priced variant — carries a distinct, defined `price` used by the
 * "price is never rendered" test to prove the value never appears in the output.
 */
export const rav4XsePriced: Vehicle = {
  ...rav4Xse,
  id: "compare-rav4-priced",
  price: 41_250,
  imageUrl: "/compare-card/compare-card-03.png",
};
