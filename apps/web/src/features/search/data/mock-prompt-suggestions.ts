import type { PromptSuggestionCardProps } from "../components/prompt-suggestion-card";

/**
 * Suggestion data structure for easier maintenance and expansion.
 */
interface SuggestionData {
  href: string;
  id: string;
  imageAlt?: string;
  imageSrc?: string;
  showSpark?: boolean;
  subtitle: string;
  title: string;
}

/** Base suggestion data for new users. */
const SUGGESTIONS_DATA: SuggestionData[] = [
  {
    id: "suggestion-popular-greater-la",
    title: "Our most popular models in Greater LA",
    subtitle: "Near you • 11201",
    href: "#",
    imageSrc: "/images/suggestion-card-image1.png",
    imageAlt: "Red SUV",
    showSpark: false,
  },
  {
    id: "suggestion-budget-sedan",
    title: "Budget-friendly options nearby",
    subtitle: "Under $30k • All types",
    href: "#",
    imageSrc: "/images/suggestion-card-image1.png",
    imageAlt: "White sedan",
    showSpark: false,
  },
  {
    id: "suggestion-fuel-efficient",
    title: "Fuel-efficient vehicles",
    subtitle: "Hybrid & Electric • 30+ mpg",
    href: "#",
    imageSrc: "/images/suggestion-card-image1.png",
    imageAlt: "Blue hybrid",
    showSpark: false,
  },
];

/**
 * Convert suggestion data to component props.
 */
function mapSuggestionsToProps(data: SuggestionData[]): PromptSuggestionCardProps[] {
  return data.map(({ id, title, subtitle, href, imageSrc, imageAlt, showSpark }) => ({
    id,
    title,
    subtitle,
    href,
    ...(imageSrc && { imageSrc }),
    ...(imageAlt && { imageAlt }),
    ...(showSpark !== undefined && { showSpark }),
  }));
}

/** Mock card with image (for testing). */
export const MOCK_SUGGESTION_WITH_IMAGE: PromptSuggestionCardProps = {
  href: "#",
  id: "suggestion-popular-greater-la",
  imageAlt: "Red SUV",
  imageSrc: "/images/suggestion-card-image1.png",
  subtitle: "Near you • 11201",
  title: "Our most popular models in Greater LA",
  showSpark: false,
};

/** Mock card without image (for testing). */
export const MOCK_SUGGESTION_WITHOUT_IMAGE: PromptSuggestionCardProps = {
  href: "#",
  id: "suggestion-budget-friendly",
  subtitle: "Under $30k • All types",
  title: "Budget-friendly options nearby",
  showSpark: false,
};

/** Mock prompt suggestion data for new users. */
export const MOCK_PROMPT_SUGGESTIONS: PromptSuggestionCardProps[] =
  mapSuggestionsToProps(SUGGESTIONS_DATA);
