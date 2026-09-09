/**
 * Inventory card sizing — aspect-ratio-only dimensions.
 *
 * Copied from shared/components/card/card-size.ts (PEDX01-2499).
 * The sm/md/lg entries now express only aspect ratio — no fixed w/h.
 * Width comes from the container (e.g. CarouselItem colSpan), and height
 * derives from the ratio.
 *
 * Named with INVENTORY_ prefix to avoid collision with the shared
 * CARD_SIZE / CARD_HOVER_SCALE / CARD_IMAGE_SIZES exports in
 * @shared/components/card/card-size.ts — prevents editor auto-import
 * from picking the wrong source.
 *
 * Search variants remain unchanged (out of scope for this ticket).
 */
export const INVENTORY_CARD_SIZE = {
  // Before: "h-[237px] w-[178px] lg:aspect-[220/293] lg:h-[293px] lg:w-[220px]"
  sm: "aspect-[178/237] lg:aspect-[220/293]",
  // Before: "h-[360px] w-[270px] lg:aspect-[334/445] lg:h-[445px] lg:w-[334px]"
  md: "aspect-[270/360] lg:aspect-[334/445]",
  // Before: "h-[482px] w-[362px] lg:aspect-[448/597] lg:h-[597px] lg:w-[448px]"
  lg: "aspect-[362/482] lg:aspect-[448/597]",
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

export type InventoryCardSizeToken = keyof typeof INVENTORY_CARD_SIZE;

/**
 * Hover-scale ratio per inventory card size.
 * Smaller cards take a slightly larger lift; larger cards a subtler one.
 */
export const INVENTORY_CARD_HOVER_SCALE: Record<InventoryCardSizeToken, number> = {
  sm: 1.025,
  md: 1.02,
  lg: 1.015,
  search: 1.025,
  "search-fill": 1.025,
  "search-fill-stacked": 1.025,
};

/**
 * Matching `sizes` hints for next/image so the browser picks the right srcset.
 *
 * For sm/md/lg: viewport-relative values that approximate grid column math.
 * For search variants: unchanged fixed pixel values.
 */
export const INVENTORY_CARD_IMAGE_SIZES: Record<InventoryCardSizeToken, string> = {
  sm: "(max-width: 768px) 45vw, (max-width: 1024px) 25vw, 220px",
  md: "(max-width: 768px) 45vw, (max-width: 1024px) 35vw, 334px",
  lg: "(max-width: 768px) 45vw, (max-width: 1024px) 35vw, 448px",
  search: "(max-width: 768px) 362px, (max-width: 1440px) 360px, 448px",
  "search-fill": "(max-width: 768px) 362px, (max-width: 1440px) 360px, 448px",
  "search-fill-stacked": "(max-width: 1024px) 178px, 220px",
};
