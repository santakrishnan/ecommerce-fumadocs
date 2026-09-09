// Regex patterns (at top level for performance)
const KEBAB_CASE_REGEX = /([a-z])([A-Z])/g;
const SEPARATOR_REGEX = /[\s_]+/g;
const CAMEL_CASE_SEPARATOR_REGEX = /[-_\s]+(.)?/g;
const FIRST_CHAR_REGEX = /^(.)/;

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a slug into a human-readable uppercase label.
 * e.g. "xle-awd" → "XLE AWD"
 */
export function formatSlugLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.toUpperCase())
    .join(" ");
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str.replace(KEBAB_CASE_REGEX, "$1-$2").replace(SEPARATOR_REGEX, "-").toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(CAMEL_CASE_SEPARATOR_REGEX, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(FIRST_CHAR_REGEX, (char) => char.toLowerCase());
}
