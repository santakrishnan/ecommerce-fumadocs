/**
 * Public surface of the vehicle-detail feature module.
 *
 * Re-export only what other features and the route layer should consume.
 * Internal helpers, hooks, and services stay private to this folder.
 *
 * Exception: selected fixtures may be exported to avoid deep imports and
 * keep module boundaries explicit.
 */

export type { VehicleSpecsData } from "./__fixtures__/vehicle-specs.fixture";
export {
  getVisibleFeatures,
  SPECS_FIXTURE_FEW,
  SPECS_FIXTURE_FULL,
  SPECS_FIXTURE_MINIMAL,
  toVehicleSpecs,
} from "./__fixtures__/vehicle-specs.fixture";
// ─── BFF (public surface for page layer) ─────────────────────────────────────
export type {
  VdpComputed,
  VdpMarketingContent,
  VdpVehicleData,
  VdpVehicleImages,
  VehicleColorData,
} from "./bff";
export {
  buildGalleryImages,
  buildGalleryImagesFromManifest,
  formatWarrantyValue,
  mapVehicleFeaturesToCategories,
  mapVehicleFeaturesToKeyList,
  mapVehicleInfoToColorData,
  mapVehicleInfoToSpecs,
  mapVehicleInfoToSpecsCategories,
  mapVehiclePackagesToModal,
} from "./bff";
// ─── Fixtures ────────────────────────────────────────────────────────────────
export { PRICE_COMPARISON_DEFAULT } from "./bff/__fixtures__/price-comparison.fixtures";
// ─── Contracts ───────────────────────────────────────────────────────────────
export type { VehicleInfoExtended } from "./bff/contracts/vehicle-info-extended";
// ─── Components (merged from features/inventory) ─────────────────────────────
export type { AskQuestionCardProps } from "./components/ask-question-card";
export { AskQuestionCard } from "./components/ask-question-card";
export type { BuyWithConfidenceProps } from "./components/buy-with-confidence";
export { BuyWithConfidence } from "./components/buy-with-confidence";
// ─── Components (merged from features/vdp) ───────────────────────────────────
export { CategorizedDetailModal } from "./components/categorized-detail-modal";
export { CertificationBadgeCard } from "./components/certification-badge-card";
export { ContinueShoppingVdpClient } from "./components/continue-shopping-vdp";
export { DealerInsightLoader, DealerInsightSkeleton } from "./components/dealer-insight-loader";
export { DetailCardPair } from "./components/detail-card-pair";
export { DetailImageCard } from "./components/detail-image-card";
export { HeroBackground } from "./components/hero-background";
// ─── Image gallery (merged from features/vdp) ───────────────────────────────
export type {
  GalleryAnchorBarProps,
  GalleryImageProps,
  GalleryOverlayProps,
  GalleryTabBarProps,
  ManifestHotspotOverlayProps,
} from "./components/image-gallery";
export {
  GalleryAnchorBar,
  GalleryImage,
  GalleryOverlay,
  GalleryTabBar,
  ManifestHotspotOverlay,
} from "./components/image-gallery";
// ─── Types ──────────────────────────────────────────────────────────────────
export type { LlmIntroductionProps } from "./components/llm-introduction";
export { LlmIntroduction } from "./components/llm-introduction";
export { PriceComparison } from "./components/price-comparison";
// ─── PurchaseCard ───
export type {
  PurchaseCardCertification,
  PurchaseCardDealer,
  PurchaseCardUpperProps,
  PurchaseCardVehicle,
  PurchasePaymentState,
  PurchaseStateActive,
  PurchaseStateDefault,
  PurchaseStateEstimated,
  PurchaseStateExpired,
} from "./components/purchase-card";
export {
  PurchaseCard,
  type PurchaseCardProps,
  PurchaseCardUpper,
} from "./components/purchase-card";
export {
  PurchaseCardRail,
  type PurchaseCardRailProps,
  PurchaseCardRailSkeleton,
} from "./components/purchase-card-rail";
export { RecordVehicleView } from "./components/record-vehicle-view";
export { RecordVehicleViewClient } from "./components/record-vehicle-view-client";
export type { StatusCardDealer, StatusCardProps, StatusCardVehicle } from "./components/sold-card";
export { buildSimilarSearchHref, StatusCard } from "./components/sold-card";
export { VEHICLE_SOLD_FIXTURE } from "./components/sold-card/__fixtures__/status-card.fixture";
export type { StatusCardStickyCtaProps } from "./components/status-card-sticky-cta";
export { StatusCardStickyCta } from "./components/status-card-sticky-cta";
export { UnblockRecentReturn } from "./components/unblock-recent-return";
export { VdpFeatures } from "./components/vdp-features";
export { VehicleDetailLayout } from "./components/vehicle-detail-layout";
export type { VehicleDetailStickyCtaProps } from "./components/vehicle-detail-sticky-cta";
export { VehicleDetailStickyCta } from "./components/vehicle-detail-sticky-cta";
export type {
  EditorialSuggestionCard,
  StatusHeroCardProps,
  UnavailableVehicleLayoutProps,
} from "./components/vehicle-sold-layout";
export {
  EditorialSuggestionsCarousel,
  SimilarVehicles,
  SimilarVehiclesSkeleton,
  StatusHeroCard,
  UnavailableVehicleLayout,
} from "./components/vehicle-sold-layout";
export type { VehicleSpecs, VehicleSpecsCardProps } from "./components/vehicle-specs-card";
export { VehicleSpecsCard } from "./components/vehicle-specs-card";
export { ViewAllFeaturesModal } from "./components/view-all-features-modal";
export { ViewAllSpecsModal } from "./components/view-all-specs-modal";
// ─── Components (merged from features/used-cars) ─────────────────────────────
export type { WarrantyCoverageItem, WarrantyInfo } from "./components/warranty-info-modal";
export { WarrantyInfoModal } from "./components/warranty-info-modal";
// ─── Data ────────────────────────────────────────────────────────────────────
export {
  COLOR_NOT_AVAILABLE_LABEL,
  DEFAULT_HERO_IMAGE,
  FALLBACK_HERO_IMAGE,
  UNAVAILABLE_VEHICLE_EDITORIAL_CARDS,
} from "./data";
// ─── Flags ───────────────────────────────────────────────────────────────────
export type {
  VdpCertificationTier,
  VdpFeatureCount,
} from "./flags/vdp-flags.constants";
export {
  VDP_COOKIE_CERTIFICATION,
  VDP_COOKIE_FEATURE_COUNT,
  VDP_COOKIE_NO_PHOTOS,
  VDP_COOKIE_SOLD,
} from "./flags/vdp-flags.constants";
// ─── VDP FAQ ───
export { useVdpFaqTurns } from "./hooks/use-vdp-faq";
// ─── Mappers ─────────────────────────────────────────────────────────────────
export { toSoldCardFromApi } from "./mappers/to-purchase-card-from-api";
// ─── Services ────────────────────────────────────────────────────────────────
export type { VehicleStatus } from "./services/get-vehicle-status";
export { getVehicleStatus } from "./services/get-vehicle-status";
export { fetchVdpFaq } from "./services/vdp-faq-client";

// ─── Types ───
export type {
  DealerHoursEntry,
  DealerImage,
  DealerInfo,
  DealerInfoData,
  DealerSummary,
  Origination,
  OriginationKind,
  PriceComparisonData,
  PurchaseCardData,
  VehicleSummary,
} from "./types";
export type { CategorizedModalProps, Category, CategoryItem } from "./types/categorized-modal";
export type {
  HotspotData,
  ImageSection,
  ManifestHotspot,
  VehicleImage,
} from "./types/image-gallery";
