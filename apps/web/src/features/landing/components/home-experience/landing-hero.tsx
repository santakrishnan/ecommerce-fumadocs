import { HeroSection } from "@features/landing";
import { SearchOverlay } from "@features/landing/components/search-prompt/search-overlay";
import { LocationPillSkeleton } from "@features/location";
import { LocationPillWrapper } from "@features/location/server";
import { Suspense } from "react";
import { HERO_CONTENT } from "../../data/hero-content";

/**
 * Landing Hero — brand mark + "Search for a car your way" headline + search overlay.
 *
 * Used on the first-visit landing experience.
 */
export function LandingHero() {
  return (
    <HeroSection
      {...HERO_CONTENT}
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
