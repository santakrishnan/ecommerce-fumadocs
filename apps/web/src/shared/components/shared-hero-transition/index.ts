// Main exports

export type {
  HeroTransitionConfig,
  SharedHeroPhase,
  SharedHeroRect,
  SharedHeroSnapshot,
} from "./config";
export {
  DEFAULT_HERO_CONFIG,
  VIEW_TRANSITION_NAME_HERO,
  VIEW_TRANSITION_NAME_TITLE,
} from "./config";
export {
  HeroTransitionOverlay,
  HeroTransitionOverlay as SharedHeroOverlay,
} from "./hero-transition-overlay";
export {
  HeroTransitionProvider,
  HeroTransitionProvider as SharedHeroTransitionProvider,
} from "./hero-transition-provider";
export { HeroTransitionContext, useHeroTransitionContext } from "./utils";
