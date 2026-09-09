import { CARD_HOVER_SCALE } from "@shared/components/card";
import { LinkInventoryCardClient, type Vehicle } from "@shared/components/inventory-card";
import { cn } from "utils";

export interface SearchResultsGridProps {
  /** Array of vehicles to display in the grid. */
  vehicles: Vehicle[];
}

const CARD_HOVER_CLASSES = cn(
  "transition-[transform,scale,box-shadow] duration-200 ease-out",
  "hover:z-10 hover:scale-[var(--carousel-hover-scale-ratio,1)] hover:shadow-hover",
  "has-[a:focus-visible]:z-10 has-[a:focus-visible]:scale-[var(--carousel-hover-scale-ratio,1)] has-[a:focus-visible]:shadow-hover",
  "motion-reduce:scale-100 motion-reduce:transition-none"
);

/**
 * Search Results Grid — responsive 24-card grid layout.
 *
 * Layout:
 * - Desktop XL+ (1280px+): 4 columns, medium card variant, gap-x-2, gap-y-3
 * - Tablet + LG (768–1279px): 4 columns, small card variant, gap-x-2, gap-y-4 / lg:gap-y-3
 * - Mobile (< 768px): 2 columns, small card variant, gap-x-2, gap-y-2
 *
 * Two grids are rendered (one for `size="medium"`, one for `size="small"`) because
 * the card `size` prop is a JS decision that can't switch via CSS alone. The card
 * component is shared infrastructure and cannot be modified for this ticket.
 * Only one grid is visible at a time (`display:none` on the other — zero layout cost).
 * A dedicated `search` size token on InventoryCard would allow collapsing to a single
 * grid in a future refactor.
 */
export function SearchResultsGrid({ vehicles }: SearchResultsGridProps) {
  if (vehicles.length === 0) {
    return (
      <p className="body-md py-12 text-center text-text-subtle" role="status">
        No vehicles found. Try adjusting your search criteria.
      </p>
    );
  }

  return (
    <section aria-label="Search results">
      {/* Desktop XL+ grid (1280px+): 4 cols, medium cards */}
      <div
        className="hidden **:data-[slot=card]:aspect-[334/445] **:data-[slot=card-root]:h-auto **:data-[slot=card]:h-auto **:data-[slot=card-root]:w-full **:data-[slot=card]:w-full xl:grid xl:grid-cols-4 xl:gap-x-2 xl:gap-y-3"
        style={{ "--carousel-hover-scale-ratio": CARD_HOVER_SCALE.search } as React.CSSProperties}
      >
        {vehicles.map((vehicle, index) => (
          <LinkInventoryCardClient
            activityPosition={index}
            activitySource="Srp"
            aspectRatio="334/445"
            key={vehicle.id}
            showSaveButton
            size="medium"
            variant="gradient"
            vehicle={vehicle}
            wrapperClassName={CARD_HOVER_CLASSES}
          />
        ))}
      </div>

      {/* Small-card grid (< 1280px): 4 cols tablet/lg, 2 cols mobile */}
      <div
        className="grid grid-cols-2 gap-x-2 gap-y-2 **:data-[slot=card]:aspect-[178/237] **:data-[slot=card-root]:h-auto **:data-[slot=card]:h-auto **:data-[slot=card-root]:w-full **:data-[slot=card]:w-full md:grid-cols-4 md:gap-y-4 md:**:data-[slot=card]:aspect-[220/293] lg:gap-y-3 xl:hidden"
        style={{ "--carousel-hover-scale-ratio": CARD_HOVER_SCALE.search } as React.CSSProperties}
      >
        {vehicles.map((vehicle, index) => (
          <LinkInventoryCardClient
            activityPosition={index}
            activitySource="Srp"
            aspectRatio="3/4"
            key={vehicle.id}
            showSaveButton
            size="small"
            variant="gradient"
            vehicle={vehicle}
            wrapperClassName={CARD_HOVER_CLASSES}
          />
        ))}
      </div>
    </section>
  );
}
