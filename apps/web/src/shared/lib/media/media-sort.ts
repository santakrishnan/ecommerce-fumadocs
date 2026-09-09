/**
 * Shared media sort utility.
 *
 * Sorts vehicle photos using a two-tier strategy:
 *
 * 1. **Preferred displayOrder sequence** — look for images with specific
 *    `displayOrder` values in a fixed order: 12, 18, 14, 16. These represent
 *    curated angles that produce the best hero/card images.
 *
 * 2. **Filename prefix fallback** — if none of the images have a preferred
 *    `displayOrder`, fall back to sorting by the numeric prefix extracted from
 *    the filename (digits before the first dash). Lower prefix = earlier in
 *    the capture sequence.
 *
 * The `displayOrder` field alone is unreliable for generic sorting (multiple
 * photos share the same value), but specific known values are trustworthy as
 * curated picks.
 *
 * Uses the Schwartzian transform (decorate-sort-undecorate) to
 * precompute sort keys in O(n), avoiding redundant string parsing during
 * O(n log n) comparisons. Each comparison is O(1) integer arithmetic.
 */

/**
 * Preferred displayOrder values, checked in this exact sequence.
 * The first match wins as the hero image.
 */
const PREFERRED_DISPLAY_ORDER = [12, 18, 14, 16] as const;

/** Precomputed rank lookup — avoids Map allocation per call. */
const PREFERRED_RANK = new Map<number, number>(
  PREFERRED_DISPLAY_ORDER.map((value, i) => [value, i])
);

/** Sentinel for items without a preferred displayOrder. */
const NO_PREFERRED = -1;

const FILENAME_PREFIX_RE = /^(\d+)-/;

/**
 * Extracts the numeric sort key from a media URL filename.
 * Matches leading digits before the first dash:
 *   "public/hash/011-abc123.jpg" → 11
 *   "public/hash/35-xyz789.jpg"  → 35
 *   "public/hash/0100-foo.jpg"   → 100
 * Returns Infinity for URLs without a parseable prefix.
 */
export function extractMediaSortKey(url: string): number {
  const lastSlash = url.lastIndexOf("/");
  const filename = lastSlash === -1 ? url : url.slice(lastSlash + 1);
  const match = filename.match(FILENAME_PREFIX_RE);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }
  const num = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY;
}

/**
 * Sorts media items using the two-tier strategy (Schwartzian transform):
 *
 * 1. If any item has a `displayOrder` in the preferred sequence (12, 18, 14, 16),
 *    items with preferred values come first (in sequence order), followed by the
 *    remaining items sorted by filename prefix.
 *
 * 2. If no item has a preferred `displayOrder`, all items are sorted by filename
 *    prefix (ascending).
 *
 * Complexity: O(n) key extraction + O(n log n) comparisons with O(1) per compare.
 * Returns a new array — does not mutate the input.
 */
export function sortMediaByFilenamePrefix<T extends { url: string; displayOrder?: number | null }>(
  items: T[]
): T[] {
  if (items.length === 0) {
    return [];
  }

  // Decorate: single O(n) pass computes rank for every item and detects
  // whether any preferred displayOrder exists at the same time (avoids a
  // separate full-array scan). fileKey is only computed for items without a
  // preferred rank, since the comparator never reads it for preferred items.
  let anyPreferred = false;
  const decorated = items.map((item) => {
    const rank =
      item.displayOrder == null
        ? NO_PREFERRED
        : (PREFERRED_RANK.get(item.displayOrder) ?? NO_PREFERRED);
    if (rank !== NO_PREFERRED) {
      anyPreferred = true;
      return { item, rank, fileKey: NO_PREFERRED };
    }
    return { item, rank, fileKey: extractMediaSortKey(item.url) };
  });

  // Sort: O(n log n) comparisons, each O(1) integer arithmetic
  if (anyPreferred) {
    decorated.sort((a, b) => {
      if (a.rank !== NO_PREFERRED && b.rank !== NO_PREFERRED) {
        return a.rank - b.rank;
      }
      if (a.rank !== NO_PREFERRED) {
        return -1;
      }
      if (b.rank !== NO_PREFERRED) {
        return 1;
      }
      return a.fileKey - b.fileKey;
    });
  } else {
    decorated.sort((a, b) => a.fileKey - b.fileKey);
  }

  // Undecorate: O(n)
  return decorated.map((d) => d.item);
}

/**
 * Returns the hero image URL from a media array using the two-tier strategy:
 *
 * 1. First image matching the preferred displayOrder sequence (12, 18, 14, 16).
 * 2. If no match, the image with the lowest filename prefix.
 *
 * Complexity: O(n) — single pass with O(1) lookups.
 * Returns undefined if the array is empty.
 */
export function resolveHeroImageUrl(
  items: Array<{ url: string; displayOrder?: number | null }>
): string | undefined {
  if (items.length === 0) {
    return;
  }

  // Single pass: check preferred displayOrder and track lowest filename key.
  // Once a preferred match is found, the fallback tracking becomes moot (the
  // return value always prefers bestPreferredUrl), so fallback key
  // computation is skipped for the rest of the loop.
  let bestPreferredRank: number = PREFERRED_DISPLAY_ORDER.length; // higher than any valid rank
  let bestPreferredUrl: string | undefined;
  let bestFallback = items[0] as { url: string };
  let bestFallbackKey = extractMediaSortKey(bestFallback.url);

  for (const item of items) {
    // Check preferred displayOrder
    if (item.displayOrder != null) {
      const rank = PREFERRED_RANK.get(item.displayOrder);
      if (rank !== undefined && rank < bestPreferredRank) {
        bestPreferredRank = rank;
        bestPreferredUrl = item.url;
        // Early exit: rank 0 is the best possible (displayOrder 12)
        if (rank === 0) {
          return item.url;
        }
      }
    }

    // Once any preferred match is found, it always wins over the fallback —
    // stop computing fallback keys for subsequent items.
    if (bestPreferredUrl !== undefined) {
      continue;
    }

    // Track lowest filename key for fallback
    const key = extractMediaSortKey(item.url);
    if (key < bestFallbackKey) {
      bestFallback = item;
      bestFallbackKey = key;
    }
  }

  return bestPreferredUrl ?? bestFallback.url;
}
