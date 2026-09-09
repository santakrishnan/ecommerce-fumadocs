import { normalizeImageUrl } from "@shared/lib/media";
import type {
  BecauseYouViewedResponse,
  BecauseYouViewedUpstreamResponse,
} from "../contracts/because-you-viewed-response.schema";

/**
 * Maps the upstream because-you-viewed response to the BFF response shape.
 * Field names are identical — this exists as the integration point for any
 * future upstream field renames or shape divergence.
 */
export function mapBecauseYouViewedUpstreamToResponse(
  upstream: BecauseYouViewedUpstreamResponse
): BecauseYouViewedResponse {
  return {
    results: upstream.results.map((item) => ({
      id: item.id,
      make: item.make,
      model: item.model,
      year: item.year,
      trim: item.trim,
      price: item.price,
      mileage: item.mileage,
      imageUrl: normalizeImageUrl(item.imageUrl),
      imageAlt: item.imageAlt,
      ctaLink: item.ctaLink,
    })),
    pagination: upstream.pagination,
  };
}
