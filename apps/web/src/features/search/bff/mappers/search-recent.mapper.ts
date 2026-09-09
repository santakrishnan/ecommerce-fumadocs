import type {
  SearchRecentResponse,
  SearchRecentUpstreamResponse,
} from "../contracts/search-recent-response.schema";

/**
 * Maps the upstream search/recent response to the BFF response shape.
 */
export function mapSearchRecentUpstreamToResponse(
  upstream: SearchRecentUpstreamResponse
): SearchRecentResponse {
  return upstream.map(({ imageUrl, imageAlt, headline, eyebrow, ctaLink }) => ({
    imageUrl,
    imageAlt,
    headline,
    eyebrow,
    ctaLink,
  }));
}
