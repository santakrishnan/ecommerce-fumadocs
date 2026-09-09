import type { ComponentType } from "react";
import { CategorySearchProvider } from "../../context/category-search-context";
import { LandingBody } from "./landing-body";
import { LandingHero } from "./landing-hero";
import { WelcomeBody } from "./welcome-body";
import { WelcomeHero } from "./welcome-hero";

// ─── Mode Types ─────────────────────────────────────────────

/**
 * Home experience modes — determines which hero and body to render.
 *
 * - `first-visit`: Landing hero + landing body (new user).
 * - `recent-return`: Landing hero + welcome body (came back within session).
 * - `lapsed-return`: Welcome hero + welcome body (returning after absence).
 */
export type HomeExperienceMode = "first-visit" | "lapsed-return" | "recent-return";

// ─── Lookup Maps ────────────────────────────────────────────

/** Hero component per mode. */
export const HERO: Record<HomeExperienceMode, ComponentType> = {
  "first-visit": LandingHero,
  "lapsed-return": WelcomeHero,
  "recent-return": LandingHero,
};

/** Body component per mode. */
export const BODY: Record<HomeExperienceMode, ComponentType> = {
  "first-visit": LandingBody,
  "lapsed-return": WelcomeBody,
  "recent-return": WelcomeBody,
};

// ─── Component ──────────────────────────────────────────────

export interface HomeExperienceProps {
  /** The experience mode — selects hero + body from lookup maps. */
  mode: HomeExperienceMode;
}

/**
 * HomeExperience — mode-driven composition of hero + body slots.
 *
 * Selects the hero and body from lookup maps based on the provided mode.
 *
 * Note: The PageGrid wrapper and spacing classes are owned by the group layout
 * (`(home)/layout.tsx`), so this component returns its direct children only.
 */
export function HomeExperience({ mode }: HomeExperienceProps) {
  const Hero = HERO[mode];
  const Body = BODY[mode];

  return (
    <CategorySearchProvider>
      <Hero />
      <Body />
    </CategorySearchProvider>
  );
}
