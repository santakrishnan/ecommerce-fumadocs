"use client";

import { SearchFilterNavigation } from "@features/search/components/search-filters/search-filter-navigation";
import { useFilterData } from "@features/search/hooks/use-filter-data";
import { useSearchLocation } from "@features/search/hooks/use-search-location";
import { getRangeFilterKeys, RANGE_FILTER_KEYS } from "@features/search/lib/filter-keys";
import {
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTopBar,
  Pill,
  Separator,
} from "@ucmp/ui";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "utils";
import type { ActiveFilter } from "../../types/filters";
import { FilterContentPanel } from "../filters-dialog/filter-content-panel";
import { FilterSearchInput } from "../filters-dialog/filter-search-input";
import { FILTER_SEARCH_KEY, FILTER_SECTIONS } from "../filters-dialog/filter-sections-data";
import { useActiveFilterSection } from "../filters-dialog/use-active-filter-section";

export interface SearchFilterDialogContentProps {
  activeFilters: ActiveFilter[];
  onApplyFilters?: (filters: ActiveFilter[]) => void;
  /** When provided, filters are scoped to this search session for accurate counts. */
  searchId?: string;
}

// ─── Animation Helpers ──────────────────────────────────────

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateElement(element: HTMLElement, deltaX: number, deltaY: number): void {
  if (typeof element.animate === "function") {
    element.animate(
      [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: "translate(0px, 0px)" }],
      { duration: 200, easing: "ease-out" }
    );
  }
}

function computePositionDelta(
  previousPosition: { left: number; top: number },
  nextPosition: { left: number; top: number }
): { deltaX: number; deltaY: number } {
  return {
    deltaX: previousPosition.left - nextPosition.left,
    deltaY: previousPosition.top - nextPosition.top,
  };
}

/**
 * SearchFilterDialogContent
 *
 * Layout shell for the filters dialog. Divided into three zones:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  TOP SECTION  — header + active pills   │
 *   ├──────────────┬──────────────────────────┤
 *   │  LEFT NAV    │  RIGHT PANEL             │
 *   │              │  scrollable filter       │
 *   │              │  sections                │
 *   ├──────────────┴──────────────────────────┤
 *   │  FOOTER — Apply filters                 │
 *   └─────────────────────────────────────────┘
 */
export function SearchFilterDialogContent({
  activeFilters,
  onApplyFilters,
  searchId,
}: SearchFilterDialogContentProps) {
  const [activeFiltersState, setActiveFiltersState] = useState(activeFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const { filterLocation } = useSearchLocation();
  const { data: filterQueryResult } = useFilterData(filterLocation, searchId);
  const filterData = filterQueryResult?.filters;
  const pillListRef = useRef<HTMLFieldSetElement | null>(null);
  const pillRefs = useRef(new Map<string, HTMLElement>());
  const previousPillPositions = useRef(new Map<string, { left: number; top: number }>());
  const dragStateRef = useRef<{ isDragging: boolean; startX: number; startScrollLeft: number }>({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const { activeKey, scrollContainerRef, scrollToSection } =
    useActiveFilterSection(FILTER_SECTIONS);

  // ─── FLIP Animation: Measure positions and animate deltas ──────────────────

  useLayoutEffect(() => {
    const listElement = pillListRef.current;
    if (!listElement || prefersReducedMotion()) {
      previousPillPositions.current.clear();
      return;
    }

    const listRect = listElement.getBoundingClientRect();
    const currentPillPositions = new Map<string, { left: number; top: number }>();

    for (const filter of activeFiltersState) {
      const pillElement = pillRefs.current.get(`${filter.key}-${filter.value}`);
      if (!pillElement) {
        continue;
      }

      const nextRect = pillElement.getBoundingClientRect();
      const nextPosition = {
        left: nextRect.left - listRect.left,
        top: nextRect.top - listRect.top,
      };
      currentPillPositions.set(`${filter.key}-${filter.value}`, nextPosition);

      const previousPosition = previousPillPositions.current.get(`${filter.key}-${filter.value}`);
      if (!previousPosition) {
        continue;
      }

      const { deltaX, deltaY } = computePositionDelta(previousPosition, nextPosition);
      if (deltaX !== 0 || deltaY !== 0) {
        animateElement(pillElement, deltaX, deltaY);
      }
    }

    previousPillPositions.current = currentPillPositions;
  }, [activeFiltersState]);

  function removeFilter(key: string, value: string) {
    setActiveFiltersState((prev) => prev.filter((f) => !(f.key === key && f.value === value)));
  }

  function handleFilterSelectionChange(filter: ActiveFilter, isSelected: boolean) {
    setActiveFiltersState((prev) => {
      const alreadySelected = prev.some((f) => f.key === filter.key && f.value === filter.value);
      const isSingleSelectFilter = RANGE_FILTER_KEYS.has(filter.key);
      const singleSelectKeys = isSingleSelectFilter
        ? new Set(getRangeFilterKeys(filter.key))
        : null;

      if (isSelected) {
        if (alreadySelected) {
          return prev;
        }

        if (singleSelectKeys) {
          return [...prev.filter((f) => !singleSelectKeys.has(f.key)), filter];
        }

        return [...prev, filter];
      }

      if (!alreadySelected) {
        return prev;
      }

      return prev.filter((f) => !(f.key === filter.key && f.value === filter.value));
    });
  }

  function clearAll() {
    setActiveFiltersState([]);
  }

  function handleScrollerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    // Don't capture pointer if the user clicked inside a pill close button
    const target = event.target as HTMLElement;
    if (target.closest("[data-slot=pill-close]")) {
      return;
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleScrollerPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current.isDragging) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    event.currentTarget.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  }

  function handleScrollerPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragStateRef.current.isDragging = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTabChange(id: string) {
    scrollToSection(id);
  }

  function handleApplyFilters() {
    onApplyFilters?.(activeFiltersState);
  }

  return (
    <DialogContent className="pb-0 lg:h-175 lg:min-w-238 lg:pb-0" innerClassName="overflow-hidden">
      <DialogTopBar className="pt-5 pb-6">
        <div className="flex flex-col items-baseline justify-between gap-3">
          <span className="subhead-lg">Filters · {activeFiltersState.length} selected</span>
          <Button
            className={cn(activeFiltersState.length === 0 && "invisible")}
            onClick={clearAll}
            size="sm"
            variant="text"
          >
            Clear all
          </Button>
        </div>
      </DialogTopBar>
      {/* Fills the DialogContent flex column — grows to fill, clips overflow so children can scroll */}
      <div className="relative flex h-full min-h-0 flex-1 flex-col">
        {/* ── TOP SECTION ──────────────────────────────────────────────────────── */}
        <div className="flex w-full shrink-0 flex-col gap-6">
          {/* Active filter pills — horizontally scrollable, FLIP animated */}
          <div
            className="scrollbar-none -mr-5 cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing lg:-mr-10"
            onPointerCancel={handleScrollerPointerUp}
            onPointerDown={handleScrollerPointerDown}
            onPointerMove={handleScrollerPointerMove}
            onPointerUp={handleScrollerPointerUp}
          >
            <fieldset
              aria-label="Active filters"
              className="flex min-w-max gap-2"
              ref={pillListRef}
            >
              {activeFiltersState.map((filter) => (
                <Pill
                  key={`${filter.key}-${filter.value}`}
                  onPressedChange={() => removeFilter(filter.key, filter.value)}
                  pressed
                  ref={(element: HTMLElement | null) => {
                    if (!element) {
                      pillRefs.current.delete(`${filter.key}-${filter.value}`);
                      return;
                    }
                    pillRefs.current.set(`${filter.key}-${filter.value}`, element);
                  }}
                  value={`${filter.key}-${filter.value}`}
                >
                  {filter.label}
                </Pill>
              ))}
            </fieldset>
          </div>

          {/* Divider */}
          <Separator />
        </div>

        {/* ── BODY ROW ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex min-h-0 flex-1 basis-0 flex-col overflow-x-clip lg:flex-row">
          {/* ── LEFT NAV ───────────────────────────────────────────────────────────*/}
          <div className="-mr-5 min-w-26 shrink-0 overflow-auto lg:mr-0 [&::-webkit-scrollbar]:hidden">
            <SearchFilterNavigation
              activeKey={activeKey}
              onTabChange={handleTabChange}
              sections={FILTER_SECTIONS}
            />
          </div>

          {/* ── RIGHT PANEL ───────────────────────────────────────────────────────
            scrollContainerRef MUST stay on this div — IntersectionObserver root.
        ─────────────────────────────────────────────────────────────────────── */}
          <div
            className="mt-8 min-h-0 w-full flex-1 basis-0 overflow-y-auto overflow-x-hidden scroll-smooth pb-20 lg:mt-0 lg:px-10 lg:pb-8 [&::-webkit-scrollbar]:hidden"
            ref={scrollContainerRef}
          >
            {activeKey === FILTER_SEARCH_KEY ? (
              <FilterSearchInput
                activeFilters={activeFiltersState}
                inputClassName="hidden lg:block"
                onFilterSelectionChange={handleFilterSelectionChange}
                onQueryChange={setSearchQuery}
                query={searchQuery}
              />
            ) : (
              <FilterContentPanel
                activeFilters={activeFiltersState}
                filterData={filterData}
                onFilterSelectionChange={handleFilterSelectionChange}
                sections={FILTER_SECTIONS}
              />
            )}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
        <DialogFooter className="absolute bottom-0 mt-0 w-full flex-col py-8 lg:flex-row lg:justify-end">
          {/* Search input pinned to bottom on mobile/tablet when Search tab is active.
            Hidden on lg: where it renders inline in the right panel. */}
          {activeKey === FILTER_SEARCH_KEY && (
            <div className="w-full lg:hidden">
              <FilterSearchInput
                activeFilters={activeFiltersState}
                hideResults
                onFilterSelectionChange={handleFilterSelectionChange}
                onQueryChange={setSearchQuery}
                query={searchQuery}
              />
            </div>
          )}

          <div
            className={cn(
              "flex w-full justify-end lg:w-auto lg:pt-0 lg:pb-0",
              activeKey === FILTER_SEARCH_KEY && "hidden lg:flex"
            )}
          >
            <DialogClose
              onClick={handleApplyFilters}
              render={
                <Button className="w-full md:w-auto" size="lg" variant="primary">
                  Apply filters
                </Button>
              }
            />
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}
