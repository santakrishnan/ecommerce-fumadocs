export {
  type BecauseYouViewedRequest,
  becauseYouViewedRequestSchema,
} from "./contracts/because-you-viewed-request.schema";
export {
  type BecauseYouViewedResponse,
  becauseYouViewedResponseSchema,
} from "./contracts/because-you-viewed-response.schema";
export type { RecommendationsErrorCode } from "./errors/recommendations.errors";
export {
  type RecommendationsErrorBody,
  recommendationsErrorResponse,
} from "./errors/recommendations-error-response";
export {
  type GetBecauseYouViewedResult,
  getBecauseYouViewed,
} from "./use-cases/get-because-you-viewed";
