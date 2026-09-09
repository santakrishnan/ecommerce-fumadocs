// Domain labels exclude `.` so segments can't overlap during backtracking,
// avoiding the polynomial ReDoS in the previous `[^\s@]+\.[^\s@]+` pattern.
const emailRegex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

/**
 * ISO 3779 VIN pattern — 17 alphanumeric characters, excluding I, O, Q.
 *
 * Single source of truth for VIN validation across the entire codebase.
 *
 * Note: This regex is case-sensitive (expects uppercase A-Z). For user input,
 * prefer `isValidVin()` which normalizes to uppercase before testing.
 */
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Validate a VIN string against ISO 3779 format.
 * Case-insensitive — uppercases the input before testing.
 */
export function isValidVin(vin: string): boolean {
  return VIN_PATTERN.test(vin.toUpperCase());
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const hexColorRegex = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const singleWordRegex = /^[a-z]+$/i;

/**
 * Validate that a string is a valid hex CSS color (e.g. "#1A2B3C", "#fff", "1a2b3c").
 * Accepts with or without leading `#`.
 */
export function isValidHexColor(value: string): boolean {
  return hexColorRegex.test(value);
}

/**
 * Validate that a string is likely a usable CSS color value for inline styles.
 * Accepts hex codes (with or without `#`) and single-word values (CSS named
 * colors like "gray", "red", "salmon"). Rejects multi-word names from the API
 * (e.g. "Cutting Edge", "Wind Chill Pearl") that browsers silently ignore.
 */
export function isValidCssColor(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (hexColorRegex.test(trimmed)) {
    return true;
  }
  // All CSS named colors are a single word — no spaces, no special chars
  return singleWordRegex.test(trimmed);
}
