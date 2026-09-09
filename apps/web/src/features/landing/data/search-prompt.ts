/**
 * Landing feature constants.
 * Centralized configuration for search prompt and related components.
 */

// ─── Search Prompt Placeholders ─────────────────────────────────────

export const SEARCH_PROMPT_PLACEHOLDERS = [
  "What are you looking for?",
  "An SUV under $25k with low mileage",
  "What's the difference between the Rav4 and Highlander?",
  "I need room for 4 but still be city-friendly",
  "A 2021 GR Supra A91-MT Edition in Matte White",
];

// ─── Typewriter Placeholder Configuration ────────────────────────────

export const TYPEWRITER_CONFIG = {
  /** Minimum typing speed per character in ms. */
  MIN_TYPING_SPEED_MS: 20,
  /** Minimum delete speed per character in ms. */
  MIN_DELETE_SPEED_MS: 10,
  /** Minimum pause duration between phrases in ms. */
  MIN_PAUSE_DURATION_MS: 500,
  /** Fraction of cycleDuration allocated to typing. */
  TYPING_DURATION_RATIO: 0.4,
} as const;

// ─── Waveform Visualizer Configuration ──────────────────────────────

export const WAVEFORM_CONFIG = {
  /** Number of bars in the waveform visualizer. */
  BAR_COUNT: 30,
  /** Minimum height of waveform bars in px. */
  MIN_HEIGHT: 2,
  /** Maximum amplitude for random bar height in px. */
  MAX_AMPLITUDE: 20,
  /** Animation interval in ms. */
  ANIMATION_INTERVAL_MS: 100,
} as const;

// ─── Image Upload Configuration ─────────────────────────────────────

export const IMAGE_UPLOAD_CONFIG = {
  /** Maximum file size in bytes (10 MB). */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed image MIME types. */
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  /** Maximum number of attached images. */
  MAX_COUNT: 10,
  /** Drag leave debounce delay in ms to prevent flickering. */
  DRAG_LEAVE_DELAY_MS: 50,
} as const;

// ─── Autocomplete Configuration ─────────────────────────────────────

export const AUTOCOMPLETE_CONFIG = {
  /** Minimum characters before suggestions fetch. */
  MIN_CHARS: 2,
  /** Maximum suggestions shown. */
  MAX_SUGGESTIONS: 6,
  /** Debounce delay in ms. */
  DEBOUNCE_MS: 200,
} as const;
