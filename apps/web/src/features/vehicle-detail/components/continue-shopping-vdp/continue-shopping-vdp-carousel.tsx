"use client";

import { CONTINUE_SHOPPING } from "@features/landing/data/continue-shopping";
import { CardCarouselSkeleton } from "@shared/components/card";
import {
  INVENTORY_CARD_HOVER_SCALE,
  LinkInventoryCard,
  type Vehicle,
} from "@shared/components/inventory-card";
import {
  Carousel,
  CarouselContent,
  CarouselGroup,
  CarouselGroupLabel,
  CarouselItem,
} from "@ucmp/ui";

export interface ContinueShoppingVdpCarouselProps {
  /** Outer wrapper class. */
  className?: string;
  /** True while the recently-viewed store is still hydrating. */
  isLoading?: boolean;
  /** Recently-viewed vehicles, most-recent first (current vehicle excluded). */
  recentlyViewed: Vehicle[];
}

/**
 * "Continue Shopping" carousel for the VDP — shows only recently viewed vehicles
 * (no "New Today" group). All items from the collection are rendered; the
 * carousel scrolls with built-in navigation arrows when there are more cards
 * than fit in the viewport.
 *
 * Returns `null` when:
 * - Loading is complete and there are no items to show.
 */
export function ContinueShoppingVdpCarousel({
  className,
  recentlyViewed,
  isLoading = false,
}: ContinueShoppingVdpCarouselProps) {
  if (!isLoading && recentlyViewed.length === 0) {
    return null;
  }

  return (
    <section aria-label="Continue shopping" className={className}>
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
    </section>
  );
}

// ─── Internal sub-components ────────────────────────────────────────────────

function VehicleItems({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <>
      {vehicles.map((vehicle) => (
        <CarouselItem colSpan={{ sm: 2, md: 2, lg: 2 }} key={vehicle.id}>
          <LinkInventoryCard
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
