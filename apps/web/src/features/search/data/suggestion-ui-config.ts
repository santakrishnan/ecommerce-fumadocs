/**
 * UI configuration for suggestion sections.
 * Centralized labels and metadata for different user types.
 */

export interface SuggestionUIConfig {
  ariaLabel: string;
  sectionLabel: string;
}

/** Configuration for new users. */
export const NEW_USER_UI_CONFIG: SuggestionUIConfig = {
  sectionLabel: "Suggestions to get started",
  ariaLabel: "Suggestions to get started",
};

/** Configuration for returning users. */
export const RETURNING_USER_UI_CONFIG: SuggestionUIConfig = {
  sectionLabel: "Suggestions based on what you've been exploring",
  ariaLabel: "Suggestions based on what you've been exploring",
};

/**
 * Get UI configuration based on user type.
 * @param isReturningUser Whether the user is a returning user
 * @returns Configuration object with labels
 */
export function getSuggestionUIConfig(isReturningUser: boolean): SuggestionUIConfig {
  return isReturningUser ? RETURNING_USER_UI_CONFIG : NEW_USER_UI_CONFIG;
}
