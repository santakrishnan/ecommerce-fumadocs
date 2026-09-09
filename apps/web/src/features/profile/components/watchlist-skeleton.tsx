import { Skeleton } from "@ucmp/ui";

/**
 * Watchlist section loading skeleton.
 *
 * Height matches the Figma wireframe (1427px = 89.1875rem).
 * Used as the Suspense fallback while <WatchlistSection /> loads.
 */
export function WatchlistSkeleton() {
  return (
    <Skeleton className="col-span-full flex h-356.75 items-center justify-start rounded-lg px-6">
      <span className="font-normal text-[1.75rem] text-text-primary leading-9 tracking-tighter">
        Watchlist
      </span>
    </Skeleton>
  );
}
