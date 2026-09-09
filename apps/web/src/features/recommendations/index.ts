/**
 * Public surface of the recommendations feature module.
 *
 * Only re-export what other features and the route layer should consume.
 * Internal helpers, services, and fixtures stay private to this folder.
 */

export type { BecauseYouViewedRequest } from "./bff/contracts/because-you-viewed-request.schema";
export { becauseYouViewedRequestSchema } from "./bff/contracts/because-you-viewed-request.schema";
export type { BecauseYouViewedResponse } from "./bff/contracts/because-you-viewed-response.schema";
export { becauseYouViewedResponseSchema } from "./bff/contracts/because-you-viewed-response.schema";
export type { RecommendationsErrorCode } from "./bff/errors/recommendations.errors";
export type { RecommendationsErrorBody } from "./bff/errors/recommendations-error-response";
export { recommendationsErrorResponse } from "./bff/errors/recommendations-error-response";
export type { GetBecauseYouViewedResult } from "./bff/use-cases/get-because-you-viewed";
export { getBecauseYouViewed } from "./bff/use-cases/get-because-you-viewed";
