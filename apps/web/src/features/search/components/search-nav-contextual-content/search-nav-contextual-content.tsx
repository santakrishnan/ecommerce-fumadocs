"use client";

import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";
import { cn } from "@ucmp/ui/lib/utils";
import { usePathname } from "next/navigation";
import { SaveSearchController } from "~/features/search/components/save-search/save-search-controller";
import { ROUTE_SEGMENT_SEARCH } from "../../data/save-search-copy";

interface SearchNavContextualContentProps {
  /**
   * The location pill node — passed from a Server Component so this client
   * component never imports next/headers directly.
   */
  locationPill: React.ReactNode;
}

/**
 * SearchNavContextualContent — occupies the search header's trailing nav slot.
 *
 * Swaps between the locationPill slot and SaveSearchController based on
 * conversational state:
 *   showLocationPill = true       → locationPill visible
 *   showSaveSearchToggle = true   → SaveSearchController visible
 *
 * Extracts sessionId from pathname and passes it to wrapper.
 * Both elements remain in the DOM so the nav slot never shifts layout.
 * The locationPill node is passed as a prop from the server layout so this
 * client component never touches next/headers.
 */
export function SearchNavContextualContent({ locationPill }: SearchNavContextualContentProps) {
  const ctx = useSearchConversationalContext();
  const pathname = usePathname();
  const showLocationPill = ctx?.showLocationPill ?? true;
  const isResultsPage = pathname?.endsWith("/results") ?? false;
  const showSaveSearchToggle = isResultsPage ? false : (ctx?.showSaveSearchToggle ?? false);

  // Extract sessionId from pathname (/search/[id])
  let sessionId = "";
  if (pathname) {
    const segments = pathname.split("/").filter(Boolean);
    const searchIndex = segments.indexOf(ROUTE_SEGMENT_SEARCH);
    if (searchIndex !== -1 && segments.length > searchIndex + 1) {
      const id = segments[searchIndex + 1];
      sessionId = id ?? "";
    }
  }

  return (
    <div className="relative">
      {/* LocationPill slot — visible in idle/focused/typing states */}
      <div
        aria-hidden={!showLocationPill}
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          !showLocationPill && "pointer-events-none opacity-0"
        )}
        inert={!showLocationPill}
      >
        {locationPill}
      </div>

      {/* SaveSearchController — appears in suggestion-selected / refinement states */}
      <div
        aria-hidden={!showSaveSearchToggle}
        className={cn(
          "absolute inset-0 flex items-center",
          "transition-opacity duration-300 ease-in-out",
          showSaveSearchToggle && "animate-save-search-slide-in-right",
          !showSaveSearchToggle && "pointer-events-none opacity-0"
        )}
        inert={!showSaveSearchToggle}
      >
        <SaveSearchController sessionId={sessionId} />
      </div>
    </div>
  );
}
