/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonalizedSearchCarousel } from "../components/personalized-search-carousel";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({ children, href, onClick, onNavigate, ...props }: any) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault(); // Prevent jsdom "Not implemented: navigation" warning
        onClick?.(e);
        onNavigate?.({ preventDefault: () => e.preventDefault() });
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { alt?: string; src?: string }) =>
    `[Image: ${alt ?? "no-alt"} src=${src ?? "none"}]`,
}));

const mockCollectionInsert = vi.fn();

vi.mock("@features/search/hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => ({ insert: mockCollectionInsert }),
}));

const MOCK_CARDS = [
  {
    eyebrow: "Continue searching",
    headline: "A fuel efficient SUV for city driving",
    href: "/search/f1a2b3c4-0001-4000-8000-000000000001",
    imageUrl: "/editorial-card/img-one.png",
    surface: "dark" as const,
  },
  {
    eyebrow: "Continue searching",
    headline: "A reliable family friendly car",
    href: "/search/f1a2b3c4-0002-4000-8000-000000000002",
    imageUrl: "/editorial-card/img-two.png",
    surface: "dark" as const,
  },
  {
    eyebrow: "Perfect for city driving",
    headline: "Fuel efficient hybrids and electric SUVs",
    href: "/search/f1a2b3c4-0003-4000-8000-000000000003",
    imageUrl: "/editorial-card/img-three.png",
    surface: "light" as const,
  },
];

describe("PersonalizedSearchCarousel", () => {
  it("renders a carousel region", () => {
    const { container } = render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).not.toBeNull();
    expect(carousel).toHaveAttribute("role", "region");
  });

  it("renders one card per data item", () => {
    render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(MOCK_CARDS.length);
  });

  it("renders each card headline", () => {
    render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    for (const card of MOCK_CARDS) {
      expect(screen.getByRole("heading", { level: 3, name: card.headline })).toBeInTheDocument();
    }
  });

  it("renders carousel items with slide role", () => {
    const { container } = render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    expect(slides).toHaveLength(MOCK_CARDS.length);
    for (const slide of slides) {
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    }
  });

  it("does not render navigation arrows in jsdom (Embla overflow can't be measured)", () => {
    // Arrows are rendered by the Carousel only when Embla reports overflow
    // (canScrollPrev/canScrollNext). jsdom doesn't produce layout measurements,
    // so Embla reports no overflow and arrows won't render in this test.
    const { container } = render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    const prev = container.querySelector("[data-slot='carousel-previous']");
    const next = container.querySelector("[data-slot='carousel-next']");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  it("renders empty when no cards provided", () => {
    const { container } = render(<PersonalizedSearchCarousel cards={[]} />);
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    expect(slides).toHaveLength(0);
  });

  it("uses large size cards", () => {
    const { container } = render(<PersonalizedSearchCarousel cards={MOCK_CARDS} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    for (const card of cards) {
      expect(card?.className).toContain("aspect-[360/480]");
    }
  });

  describe("IDB seeding on card click (nextSearchPlan)", () => {
    const CARDS_WITH_SEARCH_PLAN = [
      {
        nextSearchPlan: {
          searchId: "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789",
          query: "Find me an SUV",
        },
        eyebrow: "Continue searching",
        headline: "A fuel efficient SUV",
        href: "/search/a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789",
        imageUrl: "/editorial-card/img-one.png",
        surface: "light" as const,
      },
      {
        eyebrow: "Browse",
        headline: "Fuel efficient hybrids",
        href: "/search/b2c3d4e5-f6a7-4b8c-9d0e-f12345678901",
        imageUrl: "/editorial-card/img-two.png",
        surface: "dark" as const,
      },
    ];

    afterEach(() => {
      mockCollectionInsert.mockClear();
    });

    it("inserts a queued turn into the collection when a card with nextSearchPlan is clicked", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();
      render(<PersonalizedSearchCarousel cards={CARDS_WITH_SEARCH_PLAN} />);
      const links = screen.getAllByRole("link");
      const searchLink = links.find((l) => l.getAttribute("href")?.includes("/search/a1b2c3d4"));
      expect(searchLink).toBeDefined();
      if (!searchLink) {
        throw new Error("Expected search link with /search/a1b2c3d4 href not found");
      }
      await user.click(searchLink);
      expect(mockCollectionInsert).toHaveBeenCalledTimes(1);
      expect(mockCollectionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          searchId: "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789",
          query: "Find me an SUV",
          status: "queued",
          autoSubmitted: true,
        })
      );
    });

    it("does not insert when a card without nextSearchPlan is clicked", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();
      render(<PersonalizedSearchCarousel cards={CARDS_WITH_SEARCH_PLAN} />);
      const links = screen.getAllByRole("link");
      const plainLink = links.find((l) => l.getAttribute("href")?.includes("b2c3d4e5"));
      expect(plainLink).toBeDefined();
      if (!plainLink) {
        throw new Error("Expected plain link with b2c3d4e5 href not found");
      }
      await user.click(plainLink);
      expect(mockCollectionInsert).not.toHaveBeenCalled();
    });
  });
});
