import {
  BudgetCalculatorLoader,
  BudgetCalculatorSkeleton,
  EditorialCardsSection,
  EditorialCardsSkeleton,
  FeaturedVehiclesSection,
  FeaturedVehiclesSkeleton,
  RareFindsWrapper,
  ShopByCategorySection,
} from "@features/landing";
import { Suspense } from "react";

/**
 * Carousel sections break out of the grid padding so the scroll track
 * reaches viewport edges, while the first card aligns to the content grid.
 */
const CAROUSEL_BLEED =
  "col-span-full -mx-5 pl-5 lg:-mx-10 lg:pl-10 xl:pr-10 overflow-x-clip lg:max-xl:[&_[data-slot=carousel-next]]:right-10";

/**
 * Landing Body — editorial cards, featured vehicles, budget calculator,
 * rare finds, and shop-by-category sections.
 *
 * Used on the first-visit landing experience.
 */
export function LandingBody() {
  return (
    <>
      {/* Editorial Cards — carousel bleeds to edges */}
      <Suspense fallback={<EditorialCardsSkeleton className={CAROUSEL_BLEED} />}>
        <EditorialCardsSection className={CAROUSEL_BLEED} />
      </Suspense>

      {/* Featured Vehicles — carousel bleeds to edges */}
      <Suspense
        fallback={
          <div className={CAROUSEL_BLEED}>
            <FeaturedVehiclesSkeleton />
          </div>
        }
      >
        <FeaturedVehiclesSection className={CAROUSEL_BLEED} />
      </Suspense>

      {/* Budget Calculator — full bleed on mobile/tablet, within grid on desktop */}
      <div className="col-span-full -mx-5 lg:mx-0">
        <Suspense fallback={<BudgetCalculatorSkeleton />}>
          <BudgetCalculatorLoader />
        </Suspense>
      </div>

      {/* Rare Finds — carousel bleeds to edges */}
      <Suspense>
        <RareFindsWrapper className={CAROUSEL_BLEED} showSaveIcon />
      </Suspense>

      {/* Shop by Category — carousel bleeds to edges */}
      <ShopByCategorySection className={CAROUSEL_BLEED} />
    </>
  );
}
