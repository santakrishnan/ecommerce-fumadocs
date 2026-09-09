"use client";

import { Separator } from "@ucmp/ui";
import { cn } from "utils";

import type { FilterSectionMockData } from "./filter-mock-data";
import { FILTER_MOCK_DATA } from "./filter-mock-data";
import { FilterSectionContent } from "./filter-section-content";
import type { FilterSection } from "./filter-sections-data";

export interface SelectedFilter {
  key: string;
  label: string;
  value: string;
}

export interface FilterContentPanelProps {
  activeFilters: SelectedFilter[];
  /** BFF-sourced filter data keyed by UI section key. Falls back to mock data when absent. */
  filterData?: Record<string, FilterSectionMockData>;
  onFilterSelectionChange: (filter: SelectedFilter, isSelected: boolean) => void;
  sections: FilterSection[];
}

/**
 * Right-side content area containing all filter sections.
 * Rendered inside the scroll container owned by the parent.
 * Each section has an id for anchor targeting and IntersectionObserver.
 *
 * The Search tab is handled one level up in SearchFilterDialogContent —
 * this panel is only mounted when a regular filter section is active.
 */
export function FilterContentPanel({
  activeFilters,
  filterData,
  onFilterSelectionChange,
  sections,
}: FilterContentPanelProps) {
  return (
    <div className="flex flex-col gap-8 md:pb-8">
      {sections.map((section, index) => {
        // Per-section fallback: use BFF data if available for this key, otherwise mock data
        const sectionData =
          filterData?.[section.key] ??
          FILTER_MOCK_DATA[section.key as keyof typeof FILTER_MOCK_DATA] ??
          null;

        return (
          <section
            className={cn("flex flex-col gap-6", index > 0 && "border-neutral-300 border-t pt-8")}
            id={section.id}
            key={section.key}
          >
            {index > 0 && <Separator className="-mt-8 mb-0" />}
            <h3 className="subhead-lg">{section.label}</h3>

            {sectionData ? (
              <FilterSectionContent
                data={sectionData}
                onFilterSelectionChange={onFilterSelectionChange}
                sectionKey={section.key}
                selectedFilters={activeFilters}
              />
            ) : (
              <div className="min-h-24 rounded-sm" />
            )}
          </section>
        );
      })}
    </div>
  );
}
