import { Skeleton } from "@ucmp/ui";

/**
 * Saved Searches section loading skeleton.
 *
 * Height matches the Figma wireframe (518px = 32.375rem).
 * Used as the Suspense fallback while <SavedSearchesSection /> loads.
 */
export function SavedSearchesSkeleton() {
  return (
    <Skeleton className="col-span-full flex h-129.5 items-center justify-start rounded-lg px-6">
      <span className="font-normal text-[1.75rem] text-text-primary leading-9 tracking-tighter">
        Saved Searches
      </span>
    </Skeleton>
  );
}
