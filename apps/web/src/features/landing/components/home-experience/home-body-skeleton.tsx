import { PersonalizedSearchSkeleton } from "@features/landing";
import { ContinueShoppingSkeleton } from "@features/landing/components/continue-shopping";

/** Carousel bleed matching both LandingBody and WelcomeBody section rhythm. */
const CAROUSEL_BLEED =
  "col-span-full -mx-5 pl-5 lg:-mx-10 lg:pl-10 xl:pr-10 overflow-x-clip lg:max-xl:[&_[data-slot=carousel-next]]:right-10";

/**
 * Fallback for the streamed `HomeBody` while the visitor mode resolves.
 *
 * Must approximate both LandingBody (first-visit) and WelcomeBody
 * (recent/lapsed-return) since we don't know the mode yet.
 *
 * Both bodies start with a large-card carousel (Editorial or Personalized)
 * followed by a small-card carousel (Featured or ContinueShopping).
 * We show both skeleton shapes to cover either mode.
 */
export function HomeBodySkeleton() {
  return (
    <>
      {/* Large-card carousel — matches PersonalizedSearch or Editorial first section */}
      <PersonalizedSearchSkeleton className={CAROUSEL_BLEED} />
      {/* Small-card carousel — matches ContinueShopping or FeaturedVehicles */}
      <ContinueShoppingSkeleton className={CAROUSEL_BLEED} />
    </>
  );
}
