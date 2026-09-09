import { LocationPillSkeleton } from "@features/location";
import { LocationPillWrapper } from "@features/location/server";
import { ConversationalSearchBackdrop, SearchHeader, SearchProviders } from "@features/search";
import { resolveInitialAgentVersion } from "@features/search/bff";
import { type ReactNode, Suspense } from "react";

/**
 * The agent backend lives in an httpOnly cookie, so the version must be
 * resolved server-side. `resolveInitialAgentVersion()` is per-request and
 * deliberately unawaited — awaiting would read cookies() during prerender and
 * block navigation (nextjs.org/docs/messages/blocking-prerender-runtime).
 * We pass the promise down; SearchProviders unwraps it with use() inside its
 * Suspense boundary, keeping the static shell prerenderable.
 */
export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <SearchProviders initialAgentVersion={resolveInitialAgentVersion()}>
      <ConversationalSearchBackdrop />

      <div className="min-h-screen">
        <SearchHeader
          locationPill={
            <Suspense fallback={<LocationPillSkeleton />}>
              <LocationPillWrapper />
            </Suspense>
          }
        />
        <main className="w-full [--search-nav-height:var(--nav-height)]">{children}</main>
      </div>
    </SearchProviders>
  );
}
