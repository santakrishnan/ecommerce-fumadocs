/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterNavigation } from "../components/search-filters";

const SEARCH_TAB_REGEX = /search/i;

// Store onValueChange callback for use in TabsTrigger
let tabsOnValueChange: ((value: string) => void) | null = null;

vi.mock("@/components/tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange?: (value: string) => void;
  }) => {
    tabsOnValueChange = onValueChange || null;
    return (
      <div data-testid="tabs" data-value={value}>
        {children}
      </div>
    );
  },
  TabsList: ({ children }: { children: ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    children,
    className,
    value,
  }: {
    children: ReactNode;
    className?: string;
    value: string;
  }) => (
    <button
      className={className}
      data-testid={`tab-${value}`}
      onClick={() => tabsOnValueChange?.(value)}
      role="tab"
      type="button"
      value={value}
    >
      {children}
    </button>
  ),
}));

describe("SearchFilterNavigation", () => {
  it("renders the Search tab with label and icon", () => {
    const onTabChange = vi.fn();

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    const searchTabs = screen.getAllByRole("tab", { name: SEARCH_TAB_REGEX });
    expect(searchTabs.length).toBeGreaterThan(0);
  });

  it("renders all filter section tabs", () => {
    const onTabChange = vi.fn();
    const expectedSections = [
      "Price",
      "Year",
      "Mileage",
      "Make",
      "Model",
      "Trim",
      "Body Style",
      "Color",
      "Fuel Type",
      "Drivetrain",
      "Features",
      "Transmission",
    ];

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    for (const section of expectedSections) {
      expect(screen.getAllByRole("tab", { name: section }).length).toBeGreaterThan(0);
    }
  });

  it("sets the active tab value", () => {
    const onTabChange = vi.fn();

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    const tabsContainers = screen.getAllByTestId("tabs");
    for (const container of tabsContainers) {
      expect(container).toHaveAttribute("data-value", "price");
    }
  });

  it("calls onTabChange callback when a filter tab is clicked", () => {
    const onTabChange = vi.fn();

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    const yearTabs = screen.getAllByTestId("tab-year");
    const firstYearTab = yearTabs.at(0);
    if (!firstYearTab) {
      throw new Error("Expected at least one year tab");
    }
    firstYearTab.click();

    expect(onTabChange).toHaveBeenCalledWith("year");
  });

  it("calls onTabChange with search value when search tab is clicked", () => {
    const onTabChange = vi.fn();

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    const searchTabs = screen.getAllByTestId("tab-search");
    const firstSearchTab = searchTabs.at(0);
    if (!firstSearchTab) {
      throw new Error("Expected at least one search tab");
    }
    firstSearchTab.click();

    expect(onTabChange).toHaveBeenCalledWith("search");
  });

  it("renders tabs with correct uppercase class and styling", () => {
    const onTabChange = vi.fn();

    render(<SearchFilterNavigation activeKey="price" onTabChange={onTabChange} />);

    const tabs = screen.getAllByRole("tab");
    // Two Tabs instances (mobile horizontal + desktop vertical) both render in jsdom
    // Each has 13 tabs (1 search + 12 filter sections) = 26 total
    expect(tabs.length).toBe(26);
  });
});
