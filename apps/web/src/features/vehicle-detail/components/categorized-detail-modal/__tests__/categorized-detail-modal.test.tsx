import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "../../../types/categorized-modal";
import type { SearchAlias } from "../../../types/search-aliases";
import { CategorizedDetailModal } from "../categorized-detail-modal";

// ─── Test data ───────────────────────────────────────────────────────────────

const MOCK_CATEGORIES: Category[] = [
  {
    id: "safety",
    title: "Safety",
    items: [
      { label: "Adaptive Cruise Control" },
      { label: "Blind Spot Monitor with Rear Cross-Traffic Alert" },
    ],
  },
  {
    id: "comfort",
    title: "Comfort",
    items: [{ label: "Heated seats" }, { label: "Climate control" }],
  },
  {
    id: "tech",
    title: "Technology",
    items: [{ label: "Touchscreen" }, { label: "Apple CarPlay" }],
  },
];

const MOCK_ALIASES: SearchAlias[] = [
  {
    primaryName: "Blind Spot Monitor with Rear Cross-Traffic Alert",
    acceptedTerms: ["BSM", "blind spot"],
  },
  {
    primaryName: "Adaptive Cruise Control",
    acceptedTerms: ["ACC", "cruise"],
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CategorizedDetailModal", () => {
  describe("Rendering", () => {
    it("renders the title in the header", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeDefined();
    });

    it("renders without crashing when categories is empty", () => {
      render(<CategorizedDetailModal categories={[]} open title="Features" />);

      expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeDefined();
    });

    it("renders a section anchor element for every category", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      // Dialog content goes through a portal — query document.body
      for (const cat of MOCK_CATEGORIES) {
        expect(document.querySelector(`#category-${cat.id}`)).not.toBeNull();
      }
    });

    it("renders every item label in the content area", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      for (const cat of MOCK_CATEGORIES) {
        for (const item of cat.items) {
          expect(screen.getByText(item.label)).toBeDefined();
        }
      }
    });

    it("renders tab lists for category navigation", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const tabLists = screen.getAllByRole("tablist");
      // Two tablists: desktop (left rail) and mobile (top tabs)
      expect(tabLists.length).toBeGreaterThanOrEqual(1);
    });

    it("renders a tab for every category", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      for (const cat of MOCK_CATEGORIES) {
        const tabs = screen.getAllByRole("tab", { name: cat.title });
        expect(tabs.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Nav interaction", () => {
    it("marks the first category as active on initial render", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const safetyTabs = screen.getAllByRole("tab", { name: "Safety" });
      const hasActiveSafety = safetyTabs.some(
        (tab) => tab.getAttribute("aria-selected") === "true"
      );
      expect(hasActiveSafety).toBe(true);
    });

    it("updates the active tab when a nav tab is clicked", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const comfortTabs = screen.getAllByRole("tab", { name: "Comfort" });
      const comfortTab = comfortTabs[0];
      expect(comfortTab).toBeDefined();

      await user.click(comfortTab as HTMLElement);

      const tabsAfterClick = screen.getAllByRole("tab", { name: "Comfort" });
      const hasActiveComfort = tabsAfterClick.some(
        (tab) => tab.getAttribute("aria-selected") === "true"
      );
      expect(hasActiveComfort).toBe(true);
    });
  });

  describe("Keyboard navigation between tabs", () => {
    it("moves focus to the next tab on ArrowRight", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      // Click the first tab to anchor focus within the tablist
      const safetyTab = screen.getAllByRole("tab", { name: "Safety" })[0] as HTMLElement;
      await user.click(safetyTab);
      expect(safetyTab).toHaveFocus();

      await user.keyboard("{ArrowRight}");

      const comfortTab = screen.getAllByRole("tab", { name: "Comfort" })[0] as HTMLElement;
      expect(comfortTab).toHaveFocus();
    });

    it("moves focus to the previous tab on ArrowLeft", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const comfortTab = screen.getAllByRole("tab", { name: "Comfort" })[0] as HTMLElement;
      await user.click(comfortTab);
      expect(comfortTab).toHaveFocus();

      await user.keyboard("{ArrowLeft}");

      const safetyTab = screen.getAllByRole("tab", { name: "Safety" })[0] as HTMLElement;
      expect(safetyTab).toHaveFocus();
    });

    it("wraps focus from the last tab to the first on ArrowRight", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const techTab = screen.getAllByRole("tab", { name: "Technology" })[0] as HTMLElement;
      await user.click(techTab);
      expect(techTab).toHaveFocus();

      await user.keyboard("{ArrowRight}");

      const safetyTab = screen.getAllByRole("tab", { name: "Safety" })[0] as HTMLElement;
      expect(safetyTab).toHaveFocus();
    });
  });

  describe("Search clear button toggle", () => {
    it("shows a search icon when query is empty", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      // No clear button visible when search is empty
      expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    });

    it("shows a clear button when query is non-empty", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const searchInput = screen.getAllByRole("textbox")[0] as HTMLElement;
      await user.type(searchInput, "heated");

      expect(screen.getAllByRole("button", { name: "Clear search" }).length).toBeGreaterThan(0);
    });

    it("clears the query and hides the clear button when clicked", async () => {
      const user = userEvent.setup();
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open title="Features" />);

      const searchInput = screen.getAllByRole("textbox")[0] as HTMLElement;
      await user.type(searchInput, "heated");

      const clearButton = screen.getAllByRole("button", { name: "Clear search" })[0] as HTMLElement;
      await user.click(clearButton);

      expect(searchInput).toHaveValue("");
      expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    });
  });

  describe("Search aliases prop", () => {
    it("accepts a searchAliases prop without crashing", () => {
      render(
        <CategorizedDetailModal
          categories={MOCK_CATEGORIES}
          open
          searchAliases={MOCK_ALIASES}
          title="Features"
        />
      );

      expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeDefined();
    });
  });

  describe("Dialog wiring", () => {
    it("does not render content when open is false", () => {
      render(<CategorizedDetailModal categories={MOCK_CATEGORIES} open={false} title="Features" />);

      expect(screen.queryByRole("heading", { level: 2, name: "Features" })).toBeNull();
    });

    it("renders dialog content after opening", () => {
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <CategorizedDetailModal
          categories={MOCK_CATEGORIES}
          onOpenChange={onOpenChange}
          open={false}
          title="Features"
        />
      );

      expect(screen.queryByRole("heading", { level: 2, name: "Features" })).toBeNull();

      rerender(
        <CategorizedDetailModal
          categories={MOCK_CATEGORIES}
          onOpenChange={onOpenChange}
          open
          title="Features"
        />
      );

      expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeDefined();
    });
  });
});
