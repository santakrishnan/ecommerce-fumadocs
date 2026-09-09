"use client";

import { IconSearch } from "@ucmp/ui/icons";
import { Tabs, TabsList, TabsTrigger } from "@/components/tabs";
import { FILTER_SEARCH_KEY, FILTER_SECTIONS } from "../filters-dialog/filter-sections-data";

interface SearchFilterNavigationProps {
  activeKey: string;
  onTabChange: (id: string) => void;
  sections?: typeof FILTER_SECTIONS;
}

export function SearchFilterNavigation({
  activeKey,
  onTabChange,
  sections = FILTER_SECTIONS,
}: SearchFilterNavigationProps) {
  return (
    <>
      {/* Mobile/Tablet: horizontal scrollable tabs */}
      <div className="w-full overflow-x-auto lg:hidden [&::-webkit-scrollbar]:hidden">
        <Tabs onValueChange={onTabChange} value={activeKey}>
          <TabsList>
            <TabsTrigger value={FILTER_SEARCH_KEY}>
              Search
              <IconSearch className="size-4" />
            </TabsTrigger>
            {sections.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop: vertical tabs */}
      <div className="hidden lg:block">
        <Tabs onValueChange={onTabChange} orientation="vertical" value={activeKey}>
          <TabsList>
            <TabsTrigger value={FILTER_SEARCH_KEY}>
              Search
              <IconSearch className="size-4" />
            </TabsTrigger>
            {sections.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
