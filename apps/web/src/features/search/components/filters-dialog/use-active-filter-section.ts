"use client";

import { useEffect, useRef, useState } from "react";

import type { FilterSection } from "./filter-sections-data";
import { FILTER_SEARCH_KEY } from "./filter-sections-data";

/**
 * Tracks which filter section is currently visible in the scrollable panel
 * using IntersectionObserver, and provides a scroll-to-section function.
 *
 * When the user scrolls to the very bottom, a scroll listener overrides the
 * observer and activates the last section directly — this avoids sub-pixel
 * rounding issues on fractional DPR displays (1.25x, 1.5x) where the
 * IntersectionObserver's rootMargin may never trigger for the final item.
 *
 * sections is stabilised via a ref so the effect runs only once and always
 * reads the latest value — avoids the observer tearing down and re-initialising
 * on every render if the caller passes an inline array.
 */
export function useActiveFilterSection(sections: FilterSection[]) {
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? "");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Stabilise sections so the effect dependency is a ref, not the array value.
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const currentSections = sectionsRef.current;

    const sectionElements = currentSections
      .map((s) => container.querySelector<HTMLElement>(`#${s.id}`))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) {
          return;
        }

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const section = sectionsRef.current.find((s) => s.id === id);
            if (section) {
              setActiveKey(section.key);
            }
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    for (const el of sectionElements) {
      observer.observe(el);
    }

    // ── Scroll-to-bottom listener ───────────────────────────────────────────
    // Use a 10px threshold to account for sub-pixel rounding on fractional
    // DPR displays (1.25x, 1.5x) where the IntersectionObserver may never
    // fire for the last section.
    const handleScroll = () => {
      if (isScrollingRef.current) {
        return;
      }

      const isAtBottom =
        container.scrollHeight > container.clientHeight + 10 &&
        container.scrollTop + container.clientHeight >= container.scrollHeight - 10;

      if (isAtBottom) {
        const lastSection = sectionsRef.current.at(-1);
        if (lastSection) {
          setActiveKey(lastSection.key);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []); // runs once — reads latest sections from sectionsRef.current

  // React Compiler handles memoisation — no useCallback needed.
  function scrollToSection(key: string) {
    const container = scrollContainerRef.current;

    // "search" is a special key — scroll to top and show search input
    if (key === FILTER_SEARCH_KEY) {
      setActiveKey(key);
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const section = sectionsRef.current.find((s) => s.key === key);
    if (!(section && container)) {
      return;
    }

    // Always update activeKey immediately — this ensures the correct panel
    // mounts (e.g. switching away from Search to Price). The DOM element
    // might not exist yet (next render), so we try to scroll now and, if
    // the target isn't found, schedule a scroll after the next paint.
    setActiveKey(key);
    isScrollingRef.current = true;

    const target = container.querySelector<HTMLElement>(`#${section.id}`);
    if (target) {
      performScroll(container, target);
    } else {
      // The section elements aren't in the DOM yet (e.g. coming from Search view).
      // Wait one frame for React to render, then scroll.
      requestAnimationFrame(() => {
        const nextTarget = container.querySelector<HTMLElement>(`#${section.id}`);
        if (nextTarget) {
          performScroll(container, nextTarget);
        } else {
          isScrollingRef.current = false;
        }
      });
    }
  }

  function performScroll(container: HTMLElement, target: HTMLElement) {
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const paddingTop = Number.parseFloat(window.getComputedStyle(target).paddingTop) || 0;
    const nextScrollTop = container.scrollTop + (targetRect.top - containerRect.top) + paddingTop;

    container.scrollTo({ top: nextScrollTop, behavior: "smooth" });

    // Reset the scrolling lock after animation completes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  }

  return { activeKey, scrollToSection, scrollContainerRef };
}
