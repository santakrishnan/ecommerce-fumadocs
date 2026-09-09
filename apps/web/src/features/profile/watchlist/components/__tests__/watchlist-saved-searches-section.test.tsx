/// <reference types="@testing-library/jest-dom" />

import type { EditorialCardData } from "@features/landing/data/personalized-search-cards";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

const SAVED_SEARCHES_HEADING = /your saved searches/i;

// Mock getPersonalizedSearchCards
const mockGetPersonalizedSearchCards =
  vi.fn<() => Promise<{ success: boolean; data: EditorialCardData[] }>>();
vi.mock("@features/landing/services/get-personalized-search-cards", () => ({
  getPersonalizedSearchCards: (...args: unknown[]) =>
    mockGetPersonalizedSearchCards(...(args as [])),
}));

// Mock the client carousel to avoid IDB/client dependencies in RSC test
vi.mock("@features/landing/components/personalized-search-carousel", () => ({
  PersonalizedSearchCarousel: ({ cards }: { cards: EditorialCardData[] }) => (
    <div data-testid="personalized-search-carousel">
      {cards.map((card) => (
        <div data-testid="carousel-card" key={card.href}>
          {card.headline}
        </div>
      ))}
    </div>
  ),
}));

// Mock SectionHeader to render the title as an h2 (matching real behaviour)
vi.mock("@shared/components/section-header", () => ({
  SectionHeader: ({ title, id }: { title: string; id?: string }) => (
    <h2 data-testid="section-header" id={id}>
      {title}
    </h2>
  ),
}));

// Mock @ucmp/ui/icons — spread real exports + override specific icons for testability
vi.mock("@ucmp/ui/icons", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    IconCaretRight: (props: Record<string, unknown>) => (
      <svg data-testid="icon-IconCaretRight" {...props} />
    ),
  };
});

// Dynamic import of the async Server Component
const { WatchlistSavedSearchesSection } = await import("../watchlist-saved-searches-section");

function createCards(count: number): EditorialCardData[] {
  return Array.from({ length: count }, (_, i) => ({
    eyebrow: "Continue searching",
    headline: `Search query ${i + 1}`,
    href: `/search/id-${i + 1}`,
    imageUrl: `/editorial-card/img-${i + 1}.png`,
    surface: "dark" as const,
    nextSearchPlan: { searchId: `id-${i + 1}`, query: `Search query ${i + 1}` },
  }));
}

describe("WatchlistSavedSearchesSection", () => {
  it("renders all N cards when N > 3 (no cap)", async () => {
    const cards = createCards(7);
    mockGetPersonalizedSearchCards.mockResolvedValue({ success: true, data: cards });

    const ui = await WatchlistSavedSearchesSection({});
    render(ui as React.ReactElement);

    const renderedCards = screen.getAllByTestId("carousel-card");
    expect(renderedCards).toHaveLength(7);
    expect(renderedCards[6]).toHaveTextContent("Search query 7");
  });

  it("renders nothing when there are no saved searches", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({ success: true, data: [] });

    const ui = await WatchlistSavedSearchesSection({});
    expect(ui).toBeNull();
  });

  it("renders nothing when the service fails", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({ success: false, data: [] });

    const ui = await WatchlistSavedSearchesSection({});
    expect(ui).toBeNull();
  });

  it("renders the YOUR SAVED SEARCHES heading via SectionHeader", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({
      success: true,
      data: createCards(2),
    });

    const ui = await WatchlistSavedSearchesSection({});
    render(ui as React.ReactElement);

    const heading = screen.getByRole("heading", { name: SAVED_SEARCHES_HEADING });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("id", "watchlist-saved-searches-heading");
  });

  it("renders a chevron icon from @ucmp/ui/icons", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({
      success: true,
      data: createCards(2),
    });

    const ui = await WatchlistSavedSearchesSection({});
    render(ui as React.ReactElement);

    expect(screen.getByTestId("icon-IconCaretRight")).toBeInTheDocument();
  });

  it("heading is not wrapped in a link (see-all page is out of scope)", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({
      success: true,
      data: createCards(2),
    });

    const ui = await WatchlistSavedSearchesSection({});
    const { container } = render(ui as React.ReactElement);

    const link = container.querySelector("a");
    expect(link).not.toBeInTheDocument();
  });

  it("applies the className prop to the section wrapper", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({
      success: true,
      data: createCards(2),
    });

    const ui = await WatchlistSavedSearchesSection({ className: "my-custom-class" });
    const { container } = render(ui as React.ReactElement);

    const section = container.querySelector("section");
    expect(section).toHaveClass("my-custom-class");
  });

  it("section has accessible name via aria-labelledby", async () => {
    mockGetPersonalizedSearchCards.mockResolvedValue({
      success: true,
      data: createCards(2),
    });

    const ui = await WatchlistSavedSearchesSection({});
    const { container } = render(ui as React.ReactElement);

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-labelledby", "watchlist-saved-searches-heading");
  });
});
