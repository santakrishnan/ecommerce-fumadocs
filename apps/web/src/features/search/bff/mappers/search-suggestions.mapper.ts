import { IMAGE_BASE_URL } from "@config/images";
import type { SearchSuggestionsResponse, SearchSuggestionsUpstreamResponse } from "../contracts";

function resolveImageSrc(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  return src.startsWith("/") ? `${IMAGE_BASE_URL}${src}` : `${IMAGE_BASE_URL}/${src}`;
}

/**
 * Maps the upstream search/suggestions response to the strict BFF response shape.
 */
export function mapSearchSuggestionsUpstreamToResponse(
  upstream: SearchSuggestionsUpstreamResponse
): SearchSuggestionsResponse {
  return {
    section: upstream.section
      ? {
          ariaLabel: upstream.section.ariaLabel,
          headline: upstream.section.headline,
        }
      : undefined,
    suggestions: upstream.suggestions.map((suggestion) => {
      const metadata = suggestion.metadata
        ? {
            category: suggestion.metadata.category,
            locationLabel: suggestion.metadata.locationLabel,
          }
        : undefined;

      const hasMetadata = Boolean(metadata?.category || metadata?.locationLabel);

      return {
        id: suggestion.id,
        title: suggestion.title,
        subtitle: suggestion.subtitle,
        image: suggestion.image
          ? {
              alt: suggestion.image.alt,
              src: resolveImageSrc(suggestion.image.src),
            }
          : undefined,
        action: {
          id: suggestion.action.id,
          type: "seed-search",
          label: suggestion.action.label,
          value: suggestion.action.value,
          href: suggestion.action.href,
        },
        metadata: hasMetadata ? metadata : undefined,
      };
    }),
  };
}
