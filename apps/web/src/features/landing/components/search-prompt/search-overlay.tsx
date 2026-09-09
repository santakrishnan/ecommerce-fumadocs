"use client";

import { SearchConversationalController, SearchHeader, SearchProviders } from "@features/search";
import { IconMic } from "@ucmp/ui/icons";
import { cn } from "@ucmp/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SEARCH_ENTRY_KEY } from "~/shared/constants/search";
import { useCategorySearch } from "../../context/category-search-context";
import { SEARCH_PROMPT_PLACEHOLDERS } from "../../data/search-prompt";
import { useTypewriterPlaceholder } from "../../hooks/use-typewriter-placeholder";

interface SearchOverlayProps {
  /** Server-rendered location pill threaded from the page (reads ZIP cookie). */
  locationPill?: React.ReactNode;
}

/**
 * Wraps a state update in a View Transition so the browser morphs shared
 * elements (viewTransitionName) between old and new DOM snapshots.
 * Falls back to an instant update when the API is unavailable.
 */
function withViewTransition(update: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    // biome-ignore lint/suspicious/noExplicitAny: View Transitions API not yet in TS DOM lib
    (document as any).startViewTransition(() => {
      flushSync(update);
    });
  } else {
    update();
  }
}

/**
 * SearchOverlay — self-contained client component that renders:
 * - Closed: a search prompt facade (button that opens the overlay)
 * - Open: a full-screen overlay with the search experience
 *
 * Open/close use the View Transitions API to morph the search prompt bar
 * between its facade position and the full-screen input position.
 *
 * Navigation to /search/[id] still happens when the user submits
 * (driven by SearchConversationalController internally).
 */
export function SearchOverlay({ locationPill }: SearchOverlayProps) {
  const [open, setOpen] = useState(false);
  const [prefillQuery, setPrefillQuery] = useState("");
  const { displayText, phraseIndex } = useTypewriterPlaceholder(SEARCH_PROMPT_PLACEHOLDERS);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const categorySearch = useCategorySearch();

  const openOverlay = useCallback(() => {
    // Store the originating page path (e.g. "/" or "/welcome-back") so the
    // NavigationBar back button on /search/[id] can hard-navigate back
    // to the correct landing page. This is read by useBackHref().
    try {
      sessionStorage.setItem(SEARCH_ENTRY_KEY, pathname ?? "/");
    } catch {
      /* sessionStorage unavailable — fail silently */
    }
    withViewTransition(() => setOpen(true));
  }, [pathname]);
  const closeOverlay = useCallback(() => {
    withViewTransition(() => setOpen(false));
    setPrefillQuery("");
    // Restore focus to the trigger button after the overlay closes
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  // Listen for category card clicks that want to open the overlay with a query.
  useEffect(() => {
    if (categorySearch?.isOpen) {
      setPrefillQuery(categorySearch.defaultQuery);
      categorySearch.reset();
      try {
        sessionStorage.setItem(SEARCH_ENTRY_KEY, pathname ?? "/");
      } catch {
        /* noop */
      }
      withViewTransition(() => setOpen(true));
    }
  }, [categorySearch?.isOpen, categorySearch?.defaultQuery, categorySearch?.reset, pathname]);

  // Reset overlay when the page is restored from bfcache (e.g. browser back
  // button). If the page was navigated away while the overlay was open, the
  // browser may restore it in that state. Force-close to show the clean landing.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && open) {
        setOpen(false);
        document.body.style.overflow = "";
        document.documentElement.removeAttribute("data-search-overlay");
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [open]);

  // Lock scroll, hide site header, and handle Escape when open
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeOverlay();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-search-overlay", "");
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.removeAttribute("data-search-overlay");
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeOverlay]);

  if (!open) {
    // Facade — visually matches SearchPromptClient, opens the overlay on click
    return (
      <div className="relative mx-auto w-full lg:[view-transition-name:search-prompt]">
        <button
          aria-label="Open search"
          className={cn(
            "flex w-full items-center rounded-4xl",
            "h-16 min-h-16 border-0 bg-surface-primary px-8 shadow-none",
            "body-md text-left",
            phraseIndex === 0 ? "text-text-primary" : "text-text-muted"
          )}
          onClick={openOverlay}
          ref={triggerRef}
          type="button"
        >
          {/* Fallback to a non-breaking space when displayText is empty
              (between phrases) so the span keeps a full line-height and the
              browser's scroll anchoring doesn't jump the page below this
              partially-visible input. */}
          <span className="flex-1 truncate">{displayText || "\u00A0"}</span>
          <IconMic className="size-5 shrink-0 text-text-primary" />
        </button>
      </div>
    );
  }

  return (
    <div
      aria-label="Search"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      role="dialog"
    >
      {/* Frosted backdrop — blurs the underlying home/welcome-back page content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-overlay backdrop-blur-[50px]"
      />
      <SearchProviders>
        <div className="relative min-h-screen">
          <SearchHeader locationPill={locationPill} onBack={closeOverlay} />
          <main className="w-full">
            <SearchConversationalController defaultQuery={prefillQuery} />
          </main>
        </div>
      </SearchProviders>
    </div>
  );
}
