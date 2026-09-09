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

/** Base suggestion data for returning users (with showSpark enabled). */
const RETURNING_SUGGESTIONS_DATA: SuggestionData[] = [
  {
    id: "returning-suggestion-3row-suv",
    title: "SUVs under $30,000 with 3rd row seating",
    subtitle: "Because you were looking for family friendly options",
    href: "#",
    imageSrc: "/images/search/search-promotional-card.png",
    imageAlt: "SUV with third row seating",
    showSpark: true,
  },
  {
    id: "returning-suggestion-rav4",
    title: "A 2022 RAV4 for under $24,000 with less than 60K miles",
    subtitle: "Similar to models you've viewed before",
    href: "#",
    imageSrc: "/images/search/search-promotional-card2.png",
    imageAlt: "2022 RAV4 Hybrid",
    showSpark: true,
  },
  {
    id: "returning-suggestion-hybrid-getaway",
    title: "Hybrid SUVs for weekend getaways",
    subtitle: "Based on your recent browsing history",
    href: "#",
    imageSrc: "/images/search/search-promotional-card3.png",
    imageAlt: "Hybrid SUV for weekend getaways",
    showSpark: true,
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

/** Mock prompt suggestions for returning users (based on prior browsing activity). */
export const MOCK_PROMPT_SUGGESTIONS_RETURNING: PromptSuggestionCardProps[] = mapSuggestionsToProps(
  RETURNING_SUGGESTIONS_DATA
);
