/**
 * Origination BFF — public surface.
 *
 * Foundation (FND-01): shared `Result` type + per-domain error factory, the
 * mock/upstream service switch, and the `patch-origination` state-transition
 * endpoint. The whole origination domain is mocked behind a single
 * `USE_ORIGINATION_MOCKS` flag; when the OpenAPI spec lands only the
 * `*-upstream.ts` services + response `safeParse` change.
 */

export type { PhoneVerificationRequest } from "./contracts";
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
  type PatchOriginationRequest,
  type PatchOriginationResponse,
  patchOriginationRequestSchema,
  patchOriginationResponseSchema,
  phoneVerificationRequestSchema,
  type TradeInOfferResponse,
  type TradeInRequest,
  tradeInOfferResponseSchema,
  tradeInRequestSchema,
} from "./contracts";
export {
  createOriginationError,
  mapCaughtToOriginationError,
  type OriginationError,
  type OriginationErrorCode,
} from "./errors/origination.errors";
export {
  type OriginationErrorBody,
  originationErrorResponse,
} from "./errors/origination-error-response";
export type { Result } from "./lib/result";
export {
  type GetTradeInOfferResult,
  getTradeInOffer,
} from "./use-cases/get-trade-in-offer";
export {
  type PatchOriginationResult,
  patchOrigination,
} from "./use-cases/patch-origination";
