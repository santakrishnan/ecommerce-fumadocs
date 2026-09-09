import type {
  ProfileSuggestionsResponse,
  ProfileSuggestionsUpstreamResponse,
} from "../contracts/profile-suggestions-response.schema";

/**
 * Maps the upstream profile/suggestions response to the BFF response shape.
 * Currently a pass-through since upstream and client schemas are aligned.
 */
export function mapProfileSuggestionsUpstreamToResponse(
  upstream: ProfileSuggestionsUpstreamResponse
): ProfileSuggestionsResponse {
  return upstream.map(({ eyebrow, headline, href, imageUrl, iconName, matches, surface }) => ({
    eyebrow,
    headline,
    href,
    imageUrl,
    iconName,
    matches,
    surface,
  }));
}
