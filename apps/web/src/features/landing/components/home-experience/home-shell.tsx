import { Suspense } from "react";
import { CategorySearchProvider } from "../../context/category-search-context";
import { HomeBody } from "./home-body";
import { HomeBodySkeleton } from "./home-body-skeleton";
import { LandingHero } from "./landing-hero";

export interface HomeShellProps {
  /** Next.js page `searchParams` promise; forwarded to the streamed body. */
  searchParams: Promise<{ exp?: string | string[] }>;
}

/**
 * `/` shell — static hero streamed from the CDN with the personalized body
 * deferred into a Suspense hole.
 *
 * `LandingHero` is the hero for both modes that remain on `/` after the edge
 * redirects lapsed returns away (`first-visit`, `recent-return`), so it renders
 * unconditionally as the static shell. Only `HomeBody` (which awaits `/resolve`)
 * is dynamic — this is the PPR boundary. The page export stays synchronous so
 * the shell can prerender.
 *
 * Note: The PageGrid wrapper and spacing classes are owned by the group layout
 * (`(home)/layout.tsx`), so this component returns its direct children only.
 */
export function HomeShell({ searchParams }: HomeShellProps) {
  return (
    <CategorySearchProvider>
      <LandingHero />
      <Suspense fallback={<HomeBodySkeleton />}>
        <HomeBody searchParams={searchParams} />
      </Suspense>
    </CategorySearchProvider>
  );
}
