// ─── Inventory Fixtures (merged from features/inventory) ─────────────────────
export {
  ASK_QUESTION_SUGGESTIONS_EV,
  ASK_QUESTION_SUGGESTIONS_SEDAN,
  ASK_QUESTION_SUGGESTIONS_SUV,
  ASK_QUESTION_SUGGESTIONS_TRUCK,
} from "./ask-question.fixture";
export type {
  BuyWithConfidenceBenefit,
  BuyWithConfidenceData,
  BuyWithConfidenceImage,
} from "./buy-with-confidence.fixture";
export { BUY_WITH_CONFIDENCE_FIXTURE } from "./buy-with-confidence.fixture";
export { DEALER_BAY_RIDGE } from "./dealer-info-dialog.fixture";
// ─── VDP Feature Fixtures (merged from features/vdp) ─────────────────────────
export {
  FEATURES_FIXTURE,
  PACKAGES_FIXTURE,
} from "./features-data.fixture";
// ─── Image Gallery Fixtures (merged from features/vdp) ───────────────────────
export {
  EXTERIOR_IMAGES_FIXTURE,
  INTERIOR_IMAGES_FIXTURE,
  THREE_SIXTY_IMAGES_FIXTURE,
  VEHICLE_IMAGES_GALLERY_FIXTURE,
} from "./image-gallery.fixture";
export { ORIGINATION_FIXTURES } from "./origination.fixtures";
export { SEARCH_ALIASES_FIXTURE } from "./search-aliases.fixture";
export { SPECS_FIXTURE } from "./specs-data.fixture";
export {
  BELOW_MARKET_VINS,
  DEFAULT_ORIGINATION,
  VDP_ORIGINATION_BY_VIN,
} from "./vdp-demo-registry";
export type { CarouselVehicle, VehicleCarouselData } from "./vehicle-carousel.fixture";
export {
  CAROUSEL_FIXTURE_SPARSE,
  CAROUSEL_FIXTURE_STANDARD,
  getCarouselHeaders,
} from "./vehicle-carousel.fixture";
export type { VehicleDetailData } from "./vehicle-detail.fixture";
export {
  generateVdpFixture,
  VDP_FIXTURE_GOLD,
  VDP_FIXTURE_MINIMAL,
  VDP_FIXTURE_NO_PHOTOS,
  VDP_FIXTURE_SILVER,
  VDP_FIXTURE_UNCERTIFIED,
} from "./vehicle-detail.fixture";

// ─── Vehicle Detail Fixtures (original) ──────────────────────────────────────
export { VDP_VEHICLE_RESPONSE, VDP_VINS } from "./vehicle-detail.fixtures";
export type { VdpFlagSet } from "./vehicle-detail-flags.fixture";
export {
  ALL_VDP_FLAG_SETS,
  FLAGS_GOLD_MINIMAL,
  FLAGS_SILVER_SOME,
  FLAGS_UNCERTIFIED_NONE,
} from "./vehicle-detail-flags.fixture";
export type { VehicleImages } from "./vehicle-images.fixture";
export { VEHICLE_IMAGES_FIXTURE } from "./vehicle-images.fixture";
export type { CarfaxData, VehicleSpecsData, WarrantyData } from "./vehicle-specs.fixture";
export {
  getVisibleFeatures,
  SPECS_FIXTURE_FEW,
  SPECS_FIXTURE_FULL,
  SPECS_FIXTURE_MINIMAL,
  toVehicleSpecs,
} from "./vehicle-specs.fixture";
