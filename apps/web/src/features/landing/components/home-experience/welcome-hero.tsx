import { HeroSection } from "@features/landing";
import { SearchOverlay } from "@features/landing/components/search-prompt/search-overlay";
import { LocationPillSkeleton } from "@features/location";
import { LocationPillWrapper } from "@features/location/server";
import { Suspense } from "react";

const WELCOME_HERO = {
  headline: "Welcome back, Jason",
  subheadline:
    "I've found new matches from your recent searches for you to jump back in or let me know if I can help you with something else",
} as const;

/**
 * Welcome Hero — brand mark + "Welcome back" headline + search overlay.
 *
 * Used on the returning-visitor welcome experience.
 */
export function WelcomeHero() {
  return (
    <HeroSection
      {...WELCOME_HERO}
      className="col-span-4 md:col-span-6 md:col-start-2 lg:col-span-6 lg:col-start-4"
    >
      <SearchOverlay
        locationPill={
          <Suspense fallback={<LocationPillSkeleton />}>
            <LocationPillWrapper />
          </Suspense>
        }
      />
    </HeroSection>
  );
}
