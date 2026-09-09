import { ROUTES } from "@config/routes/constants";
import {
  type WatchlistCardProps,
  WatchlistList,
  type WatchlistVehicleItem,
} from "@features/profile/watchlist";
import { getWatchlist } from "@features/profile/watchlist/bff";
import {
  watchlistCardFixtureHighlander,
  watchlistCardFixtureRav4,
  watchlistCardFixtureSold,
} from "@features/profile/watchlist/components/watchlist-card/__fixtures__/watchlist-card.fixtures";
import { SectionHeader } from "@shared/components/section-header";
import { Button } from "@ucmp/ui";
import { IconCompare, IconPriceTagFilled } from "@ucmp/ui/icons";
import Link from "next/link";

const MIN_VEHICLES_TO_COMPARE = 3;

function resolveBadge(
  fixture: NonNullable<WatchlistCardProps["badge"]>
): NonNullable<WatchlistCardProps["badge"]> {
  return {
    ...fixture,
    startIcon:
      fixture.label === "Vehicle sold" ? undefined : (
        <IconPriceTagFilled aria-hidden="true" className="size-4 text-green-500" />
      ),
  };
}

/**
 * Converts fixture data into the WatchlistVehicleItem shape needed by WatchlistList.
 */
function toWatchlistItem(
  fixture: typeof watchlistCardFixtureRav4,
  vin: string
): WatchlistVehicleItem {
  const title =
    `${fixture.make} ${fixture.model}${fixture.trim ? ` ${fixture.trim}` : ""}`.toUpperCase();
  return {
    vin,
    title,
    imageSrc: fixture.imageSrc,
    imageAlt: fixture.imageAlt,
    cardProps: {
      ...fixture,
      badge: resolveBadge(fixture.badge),
    },
  };
}

// Fixture VINs for demo purposes (17 chars each).
const FIXTURE_VIN_RAV4 = "JTMW1RFV5ND000001";
const FIXTURE_VIN_HIGHLANDER = "5TDGZRAH1PS000002";
const FIXTURE_VIN_SOLD = "2T1BURHE0JC000003";

const fixtureItems: WatchlistVehicleItem[] = [
  toWatchlistItem(watchlistCardFixtureRav4, FIXTURE_VIN_RAV4),
  toWatchlistItem(watchlistCardFixtureHighlander, FIXTURE_VIN_HIGHLANDER),
  toWatchlistItem(watchlistCardFixtureSold, FIXTURE_VIN_SOLD),
];

/**
 * Async leaf component for the profile watchlist slot.
 *
 * Wrapped in <Suspense> by ProfilePageContent so the static shell streams first.
 * Fetches the watchlist to drive how many vehicles are visible, then renders an
 * interactive list with optimistic remove + inline undo (PEDX01-2886). A count-gated
 * Compare CTA (PEDX01-3064) is shown once the watchlist has enough vehicles.
 */
async function ProfileWatchlistContent({
  searchParams: _searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const watchlistResult = await getWatchlist();
  const vehicleCount = watchlistResult.success ? watchlistResult.data.length : 0;
  const canCompare = vehicleCount >= MIN_VEHICLES_TO_COMPARE;
  const visibleItems = fixtureItems.slice(0, vehicleCount);

  return (
    <div className="col-span-full flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader subtitle="" title="Watchlist" />
        {canCompare && (
          <Button
            leadingIcon={IconCompare}
            nativeButton={false}
            render={<Link href={ROUTES.WATCHLIST} />}
            size="sm"
            variant="secondary"
          >
            Compare
          </Button>
        )}
      </div>

      <WatchlistList items={visibleItems} listName="Watchlist" />
    </div>
  );
}

export { ProfileWatchlistContent };
