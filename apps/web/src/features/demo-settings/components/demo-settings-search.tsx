"use client";

import { AGENT_BACKEND_OPTIONS } from "@config/agent-backend";
import { APPOINTMENT_VARIANT_OPTIONS } from "@config/appointment-variant";
import { PROFILE_TIER_OPTIONS } from "@config/profile-tier";
import { TRADE_IN_VEHICLE_COUNT_OPTIONS } from "@config/trade-in-vehicle-count";
import { useFuseSearch } from "@ucmp/shared";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@ucmp/ui";
import { IconClose, IconSearch } from "@ucmp/ui/icons";
import { useEffect, useRef } from "react";
import { cn } from "utils";
import { DEMO_SETTINGS_SECTIONS } from "./demo-settings-nav";

interface SearchItem {
  description: string;
  label: string;
  sectionId: string;
  sectionLabel: string;
}

const CORPUS: readonly SearchItem[] = [
  ...DEMO_SETTINGS_SECTIONS.map((s) => ({
    label: s.label,
    description: "",
    sectionId: s.id,
    sectionLabel: s.label,
  })),
  ...AGENT_BACKEND_OPTIONS.map((o) => ({
    label: o.title,
    description: o.description,
    sectionId: "section-search-agent-backend",
    sectionLabel: "Search agent backend",
  })),
  ...PROFILE_TIER_OPTIONS.map((o) => ({
    label: o.title,
    description: o.description,
    sectionId: "section-profile-tier",
    sectionLabel: "Profile tier",
  })),
  ...APPOINTMENT_VARIANT_OPTIONS.map((o) => ({
    label: o.title,
    description: o.description,
    sectionId: "section-appointment-card-variant",
    sectionLabel: "Appointment card variant",
  })),
  ...TRADE_IN_VEHICLE_COUNT_OPTIONS.map((o) => ({
    label: o.title,
    description: o.description,
    sectionId: "section-trade-in-vehicle-count",
    sectionLabel: "Trade-in vehicle count",
  })),
];

export function DemoSettingsSearch() {
  const { query, setQuery, clearQuery, results, isSearching, hasResults } = useFuseSearch(CORPUS, {
    keys: ["label", "description", "sectionLabel"],
    threshold: 0.4,
    limit: 8,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearQuery();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [clearQuery]);

  function handleSelect(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    clearQuery();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      clearQuery();
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <InputGroup className="h-auto min-h-14 rounded-full border-0 bg-surface-primary shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupInput
          aria-label="Search settings"
          className="py-4 pl-8 text-sm placeholder:text-text-tertiary"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search settings…"
          type="text"
          value={query}
        />
        <InputGroupAddon align="inline-end" className="pr-6">
          {query ? (
            <button
              aria-label="Clear search"
              className="flex items-center text-text-tertiary transition-colors hover:text-text-primary"
              onClick={clearQuery}
              type="button"
            >
              <IconClose aria-hidden className="size-5" />
            </button>
          ) : (
            <InputGroupText>
              <IconSearch aria-hidden className="size-5 text-text-secondary" />
            </InputGroupText>
          )}
        </InputGroupAddon>
      </InputGroup>

      {isSearching && (
        <ul className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-border-default bg-surface-primary shadow-md">
          {hasResults ? (
            results.map((item) => (
              <li key={`${item.sectionId}-${item.label}`}>
                <button
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-surface-secondary"
                  onClick={() => handleSelect(item.sectionId)}
                  type="button"
                >
                  <span className="text-text-tertiary text-xs">{item.sectionLabel}</span>
                  <span
                    className={cn(
                      "text-sm text-text-primary",
                      item.label === item.sectionLabel && "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="line-clamp-1 text-text-secondary text-xs">
                      {item.description}
                    </span>
                  )}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-text-secondary">No settings found</li>
          )}
        </ul>
      )}
    </div>
  );
}
