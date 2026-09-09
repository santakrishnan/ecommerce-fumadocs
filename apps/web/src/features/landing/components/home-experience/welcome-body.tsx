import {
  DealerDealSkeleton,
  DealerDealWrapper,
  PersonalizedSearchSection,
  PersonalizedSearchSkeleton,
  RareFindsWrapper,
} from "@features/landing";
import {
  ContinueShoppingSection,
  ContinueShoppingSkeleton,
} from "@features/landing/components/continue-shopping";
import { SearchRecommendationsConnected } from "@features/landing/components/search-recommendations-connected";
import { Suspense } from "react";

/**
 * Carousel sections break out of the grid padding so the scroll track
 * reaches viewport edges, while the first card aligns to the content grid.
 *
 * Each section component renders this wrapper internally so that returning
 * `null` removes the element from the DOM entirely — no empty grid items.
 */
const CAROUSEL_BLEED =
  "col-span-full -mx-5 pl-5 lg:-mx-10 lg:pl-10 xl:pr-10 lg:max-xl:[&_[data-slot=carousel-next]]:right-10 overflow-x-clip";

/**
 * Welcome Body — personalized search, continue shopping, dealer deals,
 * rare finds, and search recommendations sections.
 *
 * Used on the returning-visitor welcome experience.
 *
 * Each section is responsible for its own outer wrapper so that when a
 * section has no data it returns `null` and leaves no element in the DOM.
 */
export function WelcomeBody() {
  return (
    <>
      {/* Personalized Search — carousel bleeds to edges */}
      <Suspense fallback={<PersonalizedSearchSkeleton className={CAROUSEL_BLEED} />}>
        <PersonalizedSearchSection className={CAROUSEL_BLEED} />
      </Suspense>

      {/* Continue Shopping + New Today + Dealer Deal — single boundary prevents CLS */}
      <Suspense
        fallback={
          <>
            <ContinueShoppingSkeleton className={CAROUSEL_BLEED} />
            <DealerDealSkeleton className="col-span-full" />
          </>
        }
      >
        <ContinueShoppingSection className={CAROUSEL_BLEED} />
        <DealerDealWrapper className="col-span-full" />
      </Suspense>

      {/* Rare Finds — has its own internal Suspense + skeleton */}
      <Suspense>
        <RareFindsWrapper className={CAROUSEL_BLEED} showSaveIcon />
      </Suspense>

      {/* Search Recommendations — client-driven, ssr:false, no skeleton */}
      <div className={CAROUSEL_BLEED}>
        <SearchRecommendationsConnected />
      </div>
    </>
  );
}
