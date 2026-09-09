/**
 * Single source of truth for card dimensions across the app.
 *
 * Cards used in carousels share a small set of named sizes. Keeping the
 * responsive width/height in one place removes the per-card `SIZE_CONFIG`
 * duplication and the drift it caused (e.g. inventory `lg` = 448×597 vs.
 * editorial `large` = 448×601).
 *
 * Axis note: `sm | md | lg` are dimensional (t-shirt) steps. `search` is kept
 * as a distinct token — not because it's "a context", but because the search
 * surfaces use a genuinely different responsive profile (distinct tablet/mobile
 * dimensions) that none of the t-shirt steps express. See the ADR.
 */
export const CARD_SIZE = {
  sm: "h-[237px] w-[178px] lg:aspect-[220/293] lg:h-[293px] lg:w-[220px]",
  md: "h-[360px] w-[270px] lg:aspect-[334/445] lg:h-[445px] lg:w-[334px]",
  lg: "h-[482px] w-[362px] lg:aspect-[448/597] lg:h-[597px] lg:w-[448px]",
  // distinct tablet/mobile profile + xl desktop step (search/comparison surfaces)
  search: "h-[482px] w-[362px] md:h-[480px] md:w-[360px] xl:h-[597px] xl:w-[448px]",
  // Viewport-filling: cards stretch to fill remaining height at lg+.
  // --search-nav-height (default 7.5rem) = top reserved space.
  // 8.5rem = pb-10 (2.5rem) + prompt input (~3.5rem) + pt-3 (0.75rem) + buffer.
  "search-fill":
    "h-[482px] aspect-[362/482] md:h-[480px] md:aspect-[360/480] lg:h-[calc(100dvh_-_var(--search-nav-height,7.5rem)_-_8.5rem)] lg:w-auto lg:aspect-[448/597]",
  // Stacked variant: two cards share the viewport height (50% minus half gap).
  "search-fill-stacked":
    "h-[237px] aspect-[178/237] md:h-[240px] md:aspect-[180/240] lg:h-[calc((100dvh_-_var(--search-nav-height,7.5rem)_-_8.5rem_-_0.5rem)_/_2)] lg:w-auto lg:aspect-[220/293]",
} as const;

export type CardSize = keyof typeof CARD_SIZE;

/**
 * Hover-scale ratio per card size, passed to `CardCarousel`'s `hoverScaleRatio`.
 * Smaller cards take a slightly larger lift; larger cards a subtler one (a fixed
 * scale reads as "more movement" on a small card than a big one). `1` = no scale.
 *
 * `md` / `search` are interpolated defaults — tune if design specifies them.
 */
export const CARD_HOVER_SCALE: Record<CardSize, number> = {
  sm: 1.025,
  md: 1.02,
  lg: 1.015,
  search: 1.025,
  "search-fill": 1.025,
  "search-fill-stacked": 1.025,
};

/** Matching `sizes` hints for next/image so the browser picks the right srcset. */
export const CARD_IMAGE_SIZES: Record<CardSize, string> = {
  sm: "(max-width: 1024px) 178px, 220px",
  md: "(max-width: 1024px) 270px, 334px",
  lg: "(max-width: 1024px) 362px, 448px",
  search: "(max-width: 768px) 362px, (max-width: 1440px) 360px, 448px",
  "search-fill": "(max-width: 768px) 362px, (max-width: 1440px) 360px, 448px",
  "search-fill-stacked": "(max-width: 1024px) 178px, 220px",
};
