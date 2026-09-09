"use client";

import { VDP_REFERRER_KEY } from "@shared/components/shared-hero-transition/config";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "utils";
import {
  toComparisonVehicles,
  toHistoryAndConditionAttributes,
  toInteriorAndComfortAttributes,
  toPerformanceAttributes,
  toPriceAndValueAttributes,
  toSafetyAttributes,
  toSelectorVehicle,
} from "../lib/to-comparison-table";
import type { CompareVehicle, ComparisonAttribute } from "../types";
import { AskQuestionSection } from "./ask-question-section/ask-question-section";
import { ComparisonTableSection } from "./comparison-table-section";
import { VehicleSelectorCarousel } from "./vehicle-selector/vehicle-selector-carousel";

// ─── Category key → mapper lookup ────────────────────────────────────────────

/**
 * Serializable category identifiers. Using string keys instead of function
 * references allows sections to cross the RSC → Client Component boundary.
 */
export type CompareCategoryKey = "history" | "interior" | "performance" | "price-value" | "safety";

const CATEGORY_MAPPER: Record<
  CompareCategoryKey,
  (vehicles: CompareVehicle[]) => ComparisonAttribute[]
> = {
  "price-value": toPriceAndValueAttributes,
  performance: toPerformanceAttributes,
  interior: toInteriorAndComfortAttributes,
  safety: toSafetyAttributes,
  history: toHistoryAndConditionAttributes,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareFaq {
  heading: string;
  id: string;
  questions: string[];
}

export interface CompareComparisonSection {
  /** Category key — resolved to a mapper function inside the client component. */
  category: CompareCategoryKey;
  faq: CompareFaq;
  title: string;
}

export interface CompareSectionProps {
  /** All vehicles available to compare (shown in the dropdown). */
  allVehicles: CompareVehicle[];
  /** VINs initially selected (determines the number of columns). */
  initialSelectedVins: string[];
  /** Comparison categories — serializable across the RSC boundary. */
  sections: CompareComparisonSection[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareSection — client orchestrator that owns column selection state.
 *
 * When the user switches a vehicle in any column:
 * 1. The dropdown closes
 * 2. The column header updates (hero image, name, details)
 * 3. All comparison table rows re-derive from the new vehicle set
 *
 * Column count is driven by `initialSelectedVins.length` and is configurable
 * by the parent (e.g. 2 on mobile watchlist, 3 on desktop).
 */
export function CompareSection({
  allVehicles,
  initialSelectedVins,
  sections,
}: CompareSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve initial VINs: prefer URL searchParams ("v" param) over props.
  // This allows the browser back button to restore exact comparison state.
  const urlVins = searchParams.get("v")?.split(",").filter(Boolean);
  const resolvedInitialVins = urlVins && urlVins.length > 0 ? urlVins : initialSelectedVins;

  const [selectedVins, setSelectedVins] = useState<string[]>(resolvedInitialVins);
  const [swapColumn, setSwapColumn] = useState(-1);
  const [isSwapOut, setIsSwapOut] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [scrollOnTop, setScrollOnTop] = useState(true);
  const hasSwappedRef = useRef(false);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when URL changes (e.g. browser back/forward). Falls back to
  // the server-provided initialSelectedVins when the "v" param is removed
  // (e.g. navigating back to a URL with no comparison state in it).
  useEffect(() => {
    const currentUrlVins = searchParams.get("v")?.split(",").filter(Boolean);
    setSelectedVins(
      currentUrlVins && currentUrlVins.length > 0 ? currentUrlVins : initialSelectedVins
    );
  }, [searchParams, initialSelectedVins]);

  // Reset scroll on fresh mount (no URL params = first visit)
  useEffect(() => {
    if (!urlVins) {
      window.scrollTo(0, 0);
    }
  }, []);

  /**
   * Store the current compare page URL as the VDP referrer so the in-app
   * back button navigates to this exact state.
   */
  const handleBeforeVdpNavigate = useCallback(() => {
    try {
      const currentUrl = `${pathname}?v=${selectedVins.join(",")}`;
      sessionStorage.setItem(VDP_REFERRER_KEY, currentUrl);
    } catch {
      // sessionStorage unavailable
    }
  }, [pathname, selectedVins]);

  // Compact on downward scroll, then expand again only when the user returns
  // to the top of the page.
  useEffect(() => {
    let lastScroll = window.scrollY;

    function handleScroll() {
      const currentScroll = window.scrollY;
      setScrollOnTop(currentScroll <= 0);

      if (currentScroll > lastScroll) {
        setIsCompact(true);
      } else if (currentScroll === 0) {
        setIsCompact(false);
      }

      lastScroll = currentScroll;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Derive the currently selected CompareVehicle objects (order matches columns)
  const selectedCompareVehicles = selectedVins
    .map((vin) => allVehicles.find((v) => v.vin === vin))
    .filter((v): v is CompareVehicle => v != null);

  // Map to Vehicle[] for the selector carousel
  const selectorVehicles = allVehicles.map(toSelectorVehicle);

  // Map to ComparisonVehicle[] for the table headers
  const comparisonVehicles = toComparisonVehicles(selectedCompareVehicles);

  const handleSelectionChange = (columnIndex: number, vehicleId: string) => {
    // Skip if same vehicle is selected
    if (selectedVins[columnIndex] === vehicleId) {
      return;
    }

    // Cancel any in-progress swap animation
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
    }

    hasSwappedRef.current = true;
    setSwapColumn(columnIndex);
    setIsSwapOut(true);

    // Phase 1: old cells fade out (200ms via animate-compare-cell-out on current cells)
    // Phase 2: after 200ms fadeout + 400ms pause, swap the data (triggers remount + cell-in animation)
    swapTimerRef.current = setTimeout(() => {
      setIsSwapOut(false);
      setSelectedVins((prev) => {
        const next = [...prev];
        next[columnIndex] = vehicleId;
        // Update URL to reflect new selection (shallow — no server round-trip)
        const params = new URLSearchParams(searchParams.toString());
        params.set("v", next.join(","));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        return next;
      });

      // Clear swapColumn after entrance animation completes
      swapTimerRef.current = setTimeout(() => {
        setSwapColumn(-1);
      }, 600);
    }, 600); // 200ms fade-out + 400ms pause
  };

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (swapTimerRef.current) {
        clearTimeout(swapTimerRef.current);
      }
    },
    []
  );

  return (
    <>
      {/* Sticky card strip — morphs between full and compact via CSS transition */}
      <div
        className={cn("sticky top-0 z-10 bg-surface-secondary", {
          "animate-compare-card-enter [--compare-card-offset:40vh]": !hasSwappedRef.current,
          "pt-8 pb-2": !scrollOnTop,
        })}
        data-compact={isCompact ? "true" : "false"}
      >
        <VehicleSelectorCarousel
          availableVehicles={selectorVehicles}
          isCompact={isCompact}
          onBeforeVdpNavigate={handleBeforeVdpNavigate}
          onSelectionChange={handleSelectionChange}
          selectedVehicleIds={selectedVins}
        />
      </div>

      {/* Comparison Tables + FAQ per category */}
      <div className={cn("relative z-0", !hasSwappedRef.current && "animate-compare-data-enter")}>
        {sections.map((section) => {
          const mapAttributes = CATEGORY_MAPPER[section.category];
          return (
            <div className="scroll-mt-35 gap-12" id={section.faq.id} key={section.faq.id}>
              <ComparisonTableSection
                attributes={mapAttributes(selectedCompareVehicles)}
                mobileColumnLimit={2}
                swapColumn={swapColumn}
                swapOut={isSwapOut}
                title={section.title}
                vehicles={comparisonVehicles}
              />
              <AskQuestionSection heading={section.faq.heading} questions={section.faq.questions} />
            </div>
          );
        })}
      </div>
    </>
  );
}
