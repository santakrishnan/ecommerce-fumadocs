/**
 * Shared card layer — the app-level foundation for all card + carousel UI.
 *
 * - `CARD_SIZE` / `CardSize`: single source of truth for card dimensions.
 * - `LinkCard` / `ButtonCard` / `StaticCard`: card shells (link, button, inert).
 * - `CardBackgroundImage`: full-bleed next/image helper for overlay cards.
 * - `SpecList`: label/value rows for spec-family cards.
 * - `CardBadge`: shared badge wrapper composing the @ucmp/ui Badge primitive.
 * - `CardCarousel`: generic, card-agnostic carousel wrapper.
 * - `CardCarouselSkeleton`: loading placeholder that matches the item layout/size.
 */

export type { Surface } from "@ucmp/ui";
export {
  averageRgbFromPixelData,
  type BottomStripSamplingOptions,
  DEFAULT_BOTTOM_COLOR_CSS,
  GradientImage as BottomAverageGradientImage,
  type GradientImageProps as BottomAverageGradientImageProps,
  type RgbColor,
  sampleBottomAverageColor,
  toRgbCss,
} from "@ucmp/ui";
export { AttributeStatList, type SpecAttribute } from "./attribute-stat-list";
export { ButtonCard, type ButtonCardProps } from "./button-card";
export { CardBackgroundImage, type CardBackgroundImageProps } from "./card-background-image";
export {
  CardBadge,
  type CardBadgeIconName,
  type CardBadgeProps,
  type CardBadgeVariant,
} from "./card-badge";
export {
  CardCarousel,
  type CardCarouselProps,
  CardCarouselSkeleton,
  type CardCarouselSkeletonProps,
} from "./card-carousel";
export {
  CARD_HOVER_SCALE,
  CARD_IMAGE_SIZES,
  CARD_SIZE,
  type CardSize,
} from "./card-size";
export type { CardActionProps, CardButtonProps, CardLinkProps } from "./card-types";
export { LinkCard, type LinkCardProps } from "./link-card";
export { PanelCard, type PanelCardProps } from "./panel-card";
export { type Spec, SpecList } from "./spec-list";
export { StaticCard, type StaticCardProps } from "./static-card";
