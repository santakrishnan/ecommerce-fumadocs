import "server-only";

import { env } from "@config/env";

/**
 * Stock image configuration for conversational search agent card responses.
 *
 * Controlled by a single env var:
 *   USE_STOCK_IMAGES = "always" | "fallback" | "none"
 *
 * - "always"   → ALL card images replaced with stock images (ignore API URLs).
 * - "fallback" → Use API image when valid; fall back to stock when empty/invalid.
 * - "none"     → Pass through API images as-is, no stock replacement.
 */

export type StockImageMode = "always" | "fallback" | "none";

const raw = (env.USE_STOCK_IMAGES ?? "none").toLowerCase().trim();

export const USE_STOCK_IMAGES: StockImageMode =
  raw === "always" || raw === "fallback" ? raw : "none";

/** Returns true if the URL is a usable image URL. */
export function isValidImageUrl(url: string | undefined | null): url is string {
  if (!url) {
    return false;
  }
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
