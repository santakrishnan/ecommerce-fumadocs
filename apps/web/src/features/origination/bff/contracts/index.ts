/**
 * Origination BFF contracts.
 *
 * The canonical data model lives in `origination-model.ts` (step vocabulary +
 * the unified `OriginationApplication` state). Zod schemas are the single
 * source of truth for validation; their inferred types are the wire contracts.
 * Origination has no upstream SDK yet — when the OpenAPI spec lands, align
 * these schemas with the generated types (use-case signatures stay put).
 */

export {
  type OriginationApplication,
  type OriginationStatus,
  type OriginationStep,
  type OriginationStepState,
  type OriginationStepStatus,
  originationApplicationSchema,
  originationStatusEnum,
  originationStepEnum,
  originationStepStateSchema,
  originationStepStatusEnum,
} from "./origination-model";
export {
  type PatchOriginationRequest,
  patchOriginationRequestSchema,
} from "./patch-origination-request.schema";
export {
  type PatchOriginationResponse,
  patchOriginationResponseSchema,
} from "./patch-origination-response.schema";
export type { PhoneVerificationRequest } from "./phone-verification-request.schema";
export { phoneVerificationRequestSchema } from "./phone-verification-request.schema";
export {
  type TradeInOfferResponse,
  tradeInOfferResponseSchema,
} from "./trade-in-offer-response.schema";
export {
  type TradeInRequest,
  tradeInRequestSchema,
} from "./trade-in-request.schema";
