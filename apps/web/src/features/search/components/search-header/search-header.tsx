"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";
import { NavigationBar } from "@shared/components/navigation-bar";
import { PageGrid } from "@ucmp/ui";
import { cn } from "@ucmp/ui/lib/utils";
import { Suspense } from "react";
import { SearchNavContextualContent } from "~/features/search/components/search-nav-contextual-content";

interface SearchHeaderProps {
  /**
   * The location pill node — rendered by a Server Component in the layout
   * and threaded through so this client island never imports next/headers.
   */
  locationPill: React.ReactNode;
  /**
   * When provided, the back button calls this instead of navigating.
   * Used by the in-page search overlay to close without a route change.
   */
  onBack?: () => void;
}

/**
 * Search page header — client island that reads SearchConversationalContext.
 * Hidden initially (idle state) and visible from the first prompt submission onward.
 */
export function SearchHeader({ locationPill, onBack }: SearchHeaderProps) {
  const ctx = useSearchConversationalContext();
  const isHidden = (ctx?.isLoading && ctx?.isQueryInitialized) ?? false;

  return (
    <header
      aria-hidden={isHidden}
      className={cn(
        // Absolute (not sticky) — the orchestrator (/search/[id]) uses a full-viewport
        // scroll container (h-dvh) with its own pt offset per turn. Sticky creates a
        // visible background band when content scrolls underneath on that page.
        // Pages must account for the header height manually (7.5rem / 120px).
        "absolute top-0 right-0 left-0 z-10",
        "transition-all duration-300 ease-in-out",
        isHidden && "pointer-events-none opacity-0"
      )}
    >
      <PageGrid aria-label="Search navigation" as="nav" className="h-24 items-center lg:h-30">
        <div className="col-span-2 flex items-center md:col-span-4 lg:col-span-3">
          <Suspense>
            <NavigationBar onBack={onBack} variant="search" />
          </Suspense>
        </div>

        <div className="col-start-4 flex items-center justify-end md:col-start-8 lg:col-start-12">
          <Suspense>
            <SearchNavContextualContent locationPill={locationPill} />
          </Suspense>
        </div>
      </PageGrid>
    </header>
  );
}
