"use client";

import { Pill, PillGroup } from "@ucmp/ui";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs";

export interface TabbedFilterSectionTab {
  key: string;
  label: string;
  pills: string[];
}

export interface TabbedFilterSectionProps {
  /** Default active tab key. Defaults to the first tab if not provided. */
  defaultTab?: string;
  onTogglePill?: (pill: string, isSelected: boolean, tabKey: string) => void;
  selectedPills?: Set<string>;
  tabs: TabbedFilterSectionTab[];
  title: string;
}

function getTabbedPillKey(tabKey: string, pill: string): string {
  return `${tabKey}-${pill}`;
}

/**
 * Reusable tabbed filter section used by Model and Features (and any future tabbed section).
 *
 * Renders:
 *   - Horizontal tab bar using @ucmp/ui Tabs
 *   - Wrapping pill grid — switching tabs swaps the pill set
 */
export function TabbedFilterSection({
  defaultTab,
  onTogglePill,
  selectedPills = new Set(),
  tabs,
  title,
}: TabbedFilterSectionProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key ?? "");

  const activePills = tabs.find((t) => t.key === activeTab)?.pills ?? [];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Tab bar — outer div constrains width, inner TabsList grows to content */}
      <div className="w-full min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <Tabs onValueChange={(value) => setActiveTab(value)} value={activeTab}>
          <TabsList aria-label={`${title} categories`} className="w-max">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} size="sm" value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Pill grid — wrapping flex, switches on tab change */}
      <PillGroup className="flex-wrap gap-2" multiple value={Array.from(selectedPills)}>
        {activePills.map((pill) => {
          const pillKey = getTabbedPillKey(activeTab, pill);
          return (
            <Pill
              hideClose
              key={pillKey}
              onPressedChange={(next) => onTogglePill?.(pill, next, activeTab)}
              value={pillKey}
            >
              {pill}
            </Pill>
          );
        })}
      </PillGroup>
    </div>
  );
}
