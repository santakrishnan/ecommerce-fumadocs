/**
 * URL slug utilities
 *
 * Hoisted at module level so RegExp objects are created once,
 * not on every function call.
 */

// Chars that act as word separators but aren't whitespace (/, |, &, +, ~, etc.)
// Replaced with a space BEFORE stripping so words don't concatenate.
// e.g. "A/B" → "A B" → "a-b"  (not "ab")
const SEPARATOR_RE = /[/|&+~]/g;

// Strip everything that isn't alphanumeric, spaces, or hyphens
const STRIP_RE = /[^a-z0-9\s-]/g;

// Collapse one-or-more whitespace chars OR hyphens into a single hyphen
// Handles: multiple spaces, mixed " - ", double-hyphens from stripping
const COLLAPSE_RE = /[\s-]+/g;

// Trim leading/trailing hyphens left after collapsing
// e.g. "-word-" → "word", "word-" → "word"
const EDGE_HYPHEN_RE = /^-+|-+$/g;

// Truncate regex — matches trailing partial word after truncation
const TRUNCATE_WORD_BOUNDARY_RE = /-[^-]*$/;

/**
 * Common English stop words to optionally strip from slugs.
 *
 * Only applied when `removeStopWords: true` is passed to `slugify()`.
 * Do NOT apply to free-text search queries (?q=) — removing "under"
 * from "items under 35" changes the search intent.
 * Apply to canonical/indexed URL slugs (e.g. product pages, category pages).
 */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
  "as",
  "up",
  "into",
  "than",
]);

export interface SlugifyOptions {
  /**
   * Truncate the slug to this many characters, cutting at the last full word.
   * Keeps URLs concise and below the ~75-char SEO sweet-spot.
   * @default 75
   */
  maxLength?: number;
  /**
   * Strip common English stop words (a, the, and, with, for, …).
   *
   * **Use for canonical/indexed URL slugs** (product detail, category pages).
   * **Do NOT use for search query params** — "items under 35" ≠ "items 35".
   * @default false
   */
  removeStopWords?: boolean;
}

/**
 * Convert a plain-text string into an SEO-friendly URL slug.
 *
 * SEO properties guaranteed:
 * - Hyphens as word separators (Google treats `-` as a word boundary)
 * - Lowercase ASCII only — no encoding noise in the URL
 * - Accented chars transliterated (é→e, ñ→n) via Unicode NFD normalisation
 * - Separator chars (/ | & + ~) become hyphens, not silent drops
 * - Consecutive hyphens collapsed; leading/trailing hyphens trimmed
 * - Optional stop-word removal for canonical slugs
 * - Optional max-length truncation at word boundary
 *
 * @example — search query (keep stop words for intent fidelity)
 * slugify("items under 35 with low stock")
 * // "items-under-35-with-low-stock"
 *
 * @example — canonical page slug (strip stop words + cap length)
 * slugify("Premium Leather Shoes with Free Shipping", { removeStopWords: true, maxLength: 50 })
 * // "premium-leather-shoes-free-shipping"
 *
 * @example — other cases
 * slugify("A/B Testing")                  // "a-b-testing"
 * slugify("Café & Restaurant")            // "cafe-restaurant"
 * slugify("BMW 3-Series")                 // "bmw-3-series"
 * slugify("  Hello   --  World!  ")       // "hello-world"
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const { removeStopWords = false, maxLength = 75 } = options;

  let slug = text
    .trim()
    .normalize("NFD") // decompose accented chars (é → e + combining ́)
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks (→ plain ASCII)
    .toLowerCase()
    .replace(SEPARATOR_RE, " ") // "/" → " " before stripping so words don't merge
    .replace(STRIP_RE, "") // remove remaining non-alphanumeric (except space/hyphen)
    .replace(COLLAPSE_RE, " ") // normalise to single spaces first
    .trim();

  if (removeStopWords) {
    slug = slug
      .split(" ")
      .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
      .join(" ");
  }

  slug = slug
    .replace(COLLAPSE_RE, "-") // spaces → hyphens
    .replace(EDGE_HYPHEN_RE, ""); // trim leading/trailing hyphens

  // Truncate at word boundary — never cut mid-word
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(TRUNCATE_WORD_BOUNDARY_RE, "");
  }

  return slug;
}

/**
 * Build a search URL from an optional query string.
 *
 * Uses `slugify()` with default options (stop words kept) — preserving
 * the full search intent in the `?q=` parameter.
 *
 * @param query  Free-text search query.
 * @param base   Base path. Defaults to `"/search"`.
 *
 * @example
 * toSearchUrl("items under 35") // "/search?q=items-under-35"
 * toSearchUrl("A/B Testing")    // "/search?q=a-b-testing"
 * toSearchUrl("")                // "/search"
 * toSearchUrl()                  // "/search"
 * toSearchUrl("widget", "/catalog/123/items") // "/catalog/123/items?q=widget"
 */
export function toSearchUrl(query?: string, base = "/search"): string {
  if (!query?.trim()) {
    return base;
  }
  // Slug is already [a-z0-9-] — all URL-safe, no encodeURIComponent needed
  const slug = slugify(query);
  return slug ? `${base}?q=${slug}` : base;
}
