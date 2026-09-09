import { LocationPillSkeleton } from "@features/location";
import { LocationPillWrapper } from "@features/location/server";
import { NavigationBar } from "@shared/components/navigation-bar";
import { PageGrid } from "@ucmp/ui";
import { type ReactNode, Suspense } from "react";

export interface HeaderProps {
  /** Override the right-side slot. Pass `null` to suppress the location pill. */
  locationSlot?: ReactNode;
  /** Override the left-side nav. Defaults to <NavigationBar />. */
  navSlot?: ReactNode;
}

/**
 * App header — fixed transparent navigation bar.
 * Full-width, always transparent background, fixed to top of viewport.
 * Mobile/tablet: h-24 (96px), p-5 (20px). Desktop (lg+): h-30 (120px), px-10 py-8.
 *
 * Kept synchronous so the static shell renders immediately.
 * The dynamic ZIP value streams in via <LocationPillWrapper> inside <Suspense>.
 *
 * The nav row is laid out on the shared PageGrid so the back button snaps to
 * the first grid column and the location pill to the last — keeping both edges
 * aligned with the page content grid and identical across every route.
 */
export function Header({ locationSlot, navSlot }: HeaderProps = {}) {
  const leftSlot =
    navSlot === undefined ? (
      <Suspense>
        <NavigationBar />
      </Suspense>
    ) : (
      navSlot
    );

  const rightSlot =
    locationSlot === undefined ? (
      <Suspense fallback={<LocationPillSkeleton />}>
        <LocationPillWrapper />
      </Suspense>
    ) : (
      locationSlot
    );

  return (
    <header
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-24 bg-transparent lg:h-30"
      data-site-header
      style={{ gridArea: "header" }}
    >
      <PageGrid aria-label="Main navigation" as="nav" className="h-full items-center">
        {leftSlot != null && (
          <div className="pointer-events-auto col-span-2 flex items-center md:col-span-4 lg:col-span-3">
            {leftSlot}
          </div>
        )}
        {rightSlot != null && (
          <div className="pointer-events-auto col-start-4 flex items-center justify-end md:col-start-8 lg:col-start-12">
            {rightSlot}
          </div>
        )}
      </PageGrid>
    </header>
  );
}
