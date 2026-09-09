import { Skeleton } from "@ucmp/ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareExperience } from "./compare-experience";

export const metadata: Metadata = {
  title: "Compare",
};

/**
 * /profile/watchlist — Compare Experience.
 *
 * Kept synchronous so the static shell streams immediately. The watchlist +
 * compare data resolves inside <CompareExperience>, wrapped in <Suspense>.
 */
export default function ProfileWatchlistPage() {
  return (
    <>
      <h1 className="h1 mb-6 lg:hidden">Compare</h1>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CompareExperience />
      </Suspense>
    </>
  );
}
