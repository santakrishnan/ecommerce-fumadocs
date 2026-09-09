import { Skeleton } from "@ucmp/ui";

/**
 * Shared loading skeleton for /profile/(with-profile-card).
 *
 * Keeps route fallback usage consistent between page.tsx Suspense
 * and loading.tsx while preserving the current two-column layout shell.
 */
export function ProfilePageSkeleton() {
  return (
    <>
      <div className="col-span-full space-y-4 md:col-span-3 lg:col-span-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-3/4" />
      </div>
      <div className="col-span-full space-y-4 md:col-span-5 lg:col-span-8 lg:col-start-5">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </>
  );
}
