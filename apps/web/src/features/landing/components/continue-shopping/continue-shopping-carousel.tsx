"use client";

import { CONTINUE_SHOPPING } from "@features/landing/data/continue-shopping";
import { CardCarouselSkeleton } from "@shared/components/card";
import { INVENTORY_CARD_HOVER_SCALE, type Vehicle } from "@shared/components/inventory-card";
import { LinkInventoryCardClient } from "@shared/components/inventory-card/link-inventory-card-client";
import {
  Carousel,
  CarouselContent,
  CarouselGroup,
  CarouselGroupLabel,
  CarouselItem,
} from "@ucmp/ui";

const NEW_TODAY = {
  title: "NEW TODAY",
  subtitle: "Here are the latest listings I've found in the last 24 hours",
} as const;

/** Max "Continue Shopping" cards on tablet/desktop so both groups fit in the viewport. */
const MAX_CS_DESKTOP = 3;

export interface ContinueShoppingCarouselProps {
  /** Outer wrapper class (e.g. carousel bleed). */
  className?: string;
  /** True while the recently-viewed store is still hydrating. */
  isLoading?: boolean;
  /** Server-fetched "New Today" listings. */
  newToday: Vehicle[];
  /** Recently-viewed vehicles, most-recent first. Supplied by the caller's store. */
  recentlyViewed: Vehicle[];
  /**
   * Sticky group headings: both labels show by default, each pinned to the left
   * edge as its group scrolls. New Today is layered above Continue Shopping, so
   * as you scroll left it takes over the edge and covers/pushes out the
   * Continue Shopping label.
   */
  stickyHeader?: boolean;
}

/**
 * Combined "Continue Shopping / New Today" carousel for the Welcome page.
 *
 * Layout behaviour:
 * - Desktop/Tablet (md+): One horizontal carousel track with two labelled groups.
 *   "Continue Shopping" is capped at 3 cards. "New Today" is always shown.
 * - Mobile (sm): Two stacked sections — "Continue Shopping" (all viewed, horizontal scroll)
 *   followed by "New Today" (horizontal scroll). Neither is hidden.
 *
 * Edge cases:
 *   N = 0 → New Today only (no CS heading)
 *   Either group empty → that group is hidden, the other still shows.
 */
export function ContinueShoppingCarousel({
  className,
  recentlyViewed,
  isLoading = false,
  newToday,
  stickyHeader = false,
}: ContinueShoppingCarouselProps) {
  const recentCount = recentlyViewed.length;

  // UC-4: No recently-viewed (and not still loading): New Today only, no CS heading.
  if (!isLoading && recentCount === 0) {
    if (newToday.length === 0) {
      return null;
    }
    return (
      <section aria-label="New listings" className={className}>
        <Carousel
          hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE.sm}
          scrollBySubitem
          stickyGroupLabels={stickyHeader}
        >
          <CarouselContent>
            <CarouselGroup>
              <CarouselGroupLabel subtitle={NEW_TODAY.subtitle} title={NEW_TODAY.title} />
              <VehicleItems vehicles={newToday} />
            </CarouselGroup>
          </CarouselContent>
        </Carousel>
      </section>
    );
  }

  // Desktop/Tablet: cap CS to 3 most-recent vehicles.
  const displayedRecentDesktop = recentlyViewed.slice(0, MAX_CS_DESKTOP);

  return (
    <section aria-label="Continue shopping and new listings" className={className}>
      {/* ── Mobile: stacked layout (visible below md) ── */}
      <div className="flex flex-col gap-8 md:hidden">
        <Carousel hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE.sm} scrollBySubitem>
          <CarouselContent>
            <CarouselGroup>
              <CarouselGroupLabel
                subtitle={CONTINUE_SHOPPING.subtitle}
                title={CONTINUE_SHOPPING.title}
              />
              {isLoading ? <SkeletonItems count={3} /> : <VehicleItems vehicles={recentlyViewed} />}
            </CarouselGroup>
          </CarouselContent>
        </Carousel>

        {newToday.length > 0 && (
          <Carousel
            data-testid="new-today-group-mobile"
            hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE.sm}
            scrollBySubitem
          >
            <CarouselContent>
              <CarouselGroup>
                <CarouselGroupLabel subtitle={NEW_TODAY.subtitle} title={NEW_TODAY.title} />
                <VehicleItems vehicles={newToday} />
              </CarouselGroup>
            </CarouselContent>
          </Carousel>
        )}
      </div>

      {/* ── Tablet + Desktop: grouped carousel (visible md+) ── */}
      <div className="hidden md:block">
        <Carousel
          hoverScaleRatio={INVENTORY_CARD_HOVER_SCALE.sm}
          scrollBySubitem
          stickyGroupLabels={stickyHeader}
        >
          <CarouselContent>
            <CarouselGroup>
              <CarouselGroupLabel
                subtitle={CONTINUE_SHOPPING.subtitle}
                title={CONTINUE_SHOPPING.title}
              />
              {isLoading ? (
                <SkeletonItems count={MAX_CS_DESKTOP} />
              ) : (
                <VehicleItems vehicles={displayedRecentDesktop} />
              )}
            </CarouselGroup>

            {newToday.length > 0 && (
              <CarouselGroup data-testid="new-today-group">
                <CarouselGroupLabel subtitle={NEW_TODAY.subtitle} title={NEW_TODAY.title} />
                <VehicleItems vehicles={newToday} />
              </CarouselGroup>
            )}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

// ─── Internal sub-components ────────────────────────────────────────────────

/** Carousel sub-items inside a group. */
function VehicleItems({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <>
      {vehicles.map((vehicle) => (
        <CarouselItem colSpan={{ sm: 2, md: 2, lg: 2 }} key={vehicle.id}>
          <LinkInventoryCardClient
            activitySource="WelcomeBack"
            aspectRatio="178/237"
            showBadge
            showSaveButton
            size="small"
            variant="gradient"
            vehicle={vehicle}
          />
        </CarouselItem>
      ))}
    </>
  );
}

/** Skeleton placeholders wrapped in CarouselItem for proper Embla tracking. */
function SkeletonItems({ count }: { count: number }) {
  const keys = Array.from({ length: count }, (_, i) => `skeleton-${i}`);
  return (
    <>
      {keys.map((key) => (
        <CarouselItem colSpan={{ sm: 2, md: 2, lg: 2 }} key={key}>
          <CardCarouselSkeleton
            cardClassName="w-full aspect-[178/237] lg:aspect-[220/293]"
            count={1}
          />
        </CarouselItem>
      ))}
    </>
  );
}
