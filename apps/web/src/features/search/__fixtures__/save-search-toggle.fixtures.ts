/**
 * Fixtures for SaveSearchToggle component testing
 */

export const SAVE_SEARCH_BUTTON_FIXTURES = {
  /**
   * Default state - toggle off (unsaved)
   */
  unsaved: {
    text: "Save search",
  },

  /**
   * Saved state - toggle on
   */
  saved: {
    text: "Search saved",
  },

  /**
   * Click iterations for state testing
   */
  clickIterations: 5,
} as const;
