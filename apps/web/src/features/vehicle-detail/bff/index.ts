// ─── Contracts ────────────────────────────────────────────────────────────────

// ─── Fixtures ────────────────────────────────────────────────────────────────
export {
  DEALER_INSIGHT_CLOSED_NO_PHONE_FIXTURE,
  DEALER_INSIGHT_DEFAULT_FIXTURE,
  DEALER_INSIGHT_MINIMAL_FIXTURE,
  DEALER_INSIGHT_NO_HOURS_FIXTURE,
  DEALER_INSIGHT_NO_PHOTOS_FIXTURE,
  DEALER_INSIGHT_NO_RATING_FIXTURE,
} from "./__fixtures__/dealer-insight-response.fixture";
export {
  VDP_RESPONSE_DEFAULT_FIXTURE,
  VDP_RESPONSE_ESTIMATE_FIXTURE,
  VDP_RESPONSE_EXPIRED_FIXTURE,
  VDP_RESPONSE_NO_PHOTOS_FIXTURE,
  VDP_RESPONSE_OFFER_FIXTURE,
  VDP_RESPONSE_SOLD_FIXTURE,
} from "./__fixtures__/vdp-response.fixture";
export { buildVdpCertification } from "./certification-content";
export type { DealerExtended, VdpDealer } from "./contracts/dealer-detail.schema";
export type {
  DealerInsight,
  DealerInsightAddress,
  DealerInsightHours,
  DealerInsightHoursEntry,
  DealerInsightMapThumbnail,
  DealerInsightMedia,
  DealerInsightPhoto,
  DealerInsightRating,
  DealerInsightResponse,
} from "./contracts/dealer-insight-response.schema";
export {
  dealerInsightResponseSchema,
  dealerInsightSchema,
} from "./contracts/dealer-insight-response.schema";
export {
  type InventoryItem,
  type InventoryUpstreamItem,
  inventorySchema,
  inventoryUpstreamSchema,
} from "./contracts/inventory.schema";
export type { OriginationResponse } from "./contracts/origination.schema";
export { originationSchema } from "./contracts/origination.schema";
export type { VdpVin } from "./contracts/vdp-request.schema";
export { vdpVinSchema } from "./contracts/vdp-request.schema";
export type {
  VdpApiResponse,
  VdpCertification,
  VdpCertificationModal,
  VdpCertificationModalRow,
  VdpCertificationModalValue,
  VdpComputed,
  VdpData,
  VdpFaq,
  VdpFaqQuestion,
  VdpMarketingContent,
  VdpPricingCard,
  VdpSimilarVehicles,
  VdpVehicleData,
  VdpVehicleImage,
  VdpVehicleImages,
} from "./contracts/vdp-response.schema";
// ─── VDP Search FAQ ──────────────────────────────────────────────────────────
export type {
  VdpFaqCard,
  VdpFaqMessage,
  VdpSearchFaqApiResponse,
  VdpSearchFaqRequest,
  VdpSearchFaqResponseData,
} from "./contracts/vdp-search-faq.schema";
export {
  vdpSearchFaqApiResponseSchema,
  vdpSearchFaqRequestSchema,
} from "./contracts/vdp-search-faq.schema";
// ─── Errors ──────────────────────────────────────────────────────────────────
export type { VdpError, VdpErrorCode } from "./errors/vdp.errors";
export { createVdpError, mapCaughtToVdpError } from "./errors/vdp.errors";
export type { VdpErrorBody } from "./errors/vdp-error-response";
export { vdpErrorResponse } from "./errors/vdp-error-response";
// ─── Mappers ─────────────────────────────────────────────────────────────────
export {
  mapVehicleFeaturesToCategories,
  mapVehicleFeaturesToKeyList,
} from "./mappers/features-to-categories.mapper";
export { mapVehiclePackagesToModal } from "./mappers/packages-to-modal.mapper";
export type { VehicleColorData } from "./mappers/vehicle-info-to-color-data.mapper";
export { mapVehicleInfoToColorData } from "./mappers/vehicle-info-to-color-data.mapper";
export { mapVehicleInfoToSpecs } from "./mappers/vehicle-info-to-specs.mapper";
export { mapVehicleInfoToSpecsCategories } from "./mappers/vehicle-info-to-specs-categories.mapper";
export { formatWarrantyValue } from "./mappers/warranty.mapper";
// ─── Use-Cases ───────────────────────────────────────────────────────────────
export type {
  GetDealerInsightInput,
  GetDealerInsightResult,
} from "./use-cases/get-dealer-insight";
export { getDealerInsight } from "./use-cases/get-dealer-insight";
export type { GetVdpSearchFaqInput, GetVdpSearchFaqResult } from "./use-cases/get-vdp-search-faq";
export { getVdpSearchFaq } from "./use-cases/get-vdp-search-faq";
export type {
  GetVehicleDetailInput,
  GetVehicleDetailResult,
} from "./use-cases/get-vehicle-detail";
export { getVehicleDetail, transformVdpToWelcomeBackShape } from "./use-cases/get-vehicle-detail";
export {
  buildGalleryImages,
  buildGalleryImagesFromManifest,
  extractSourceIdFromManifestSrc,
} from "./utils/gallery-utils";
