/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { EditorialCardsCarousel } from "../components/editorial-cards-carousel";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { alt?: string; src?: string }) =>
    `[Image: ${alt ?? "no-alt"} src=${src ?? "none"}]`,
}));

const MOCK_CARDS = [
  {
    eyebrow: "Trending near you",
    headline: "Popular models in Greater LA",
    href: "/search?trending=true",
    imageUrl: "/editorial-card/img-one.png",
    surface: "dark" as const,
  },
  {
    eyebrow: "Based on your search",
    headline: "Family friendly SUVs",
    href: "/search?category=family-suv",
    imageUrl: "/editorial-card/img-two.png",
    surface: "light" as const,
  },
];

describe("EditorialCardsCarousel", () => {
  it("renders a carousel region", () => {
    const { container } = render(<EditorialCardsCarousel cards={MOCK_CARDS} />);
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).not.toBeNull();
    expect(carousel).toHaveAttribute("role", "region");
  });

  it("renders one card per data item", () => {
    render(<EditorialCardsCarousel cards={MOCK_CARDS} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(MOCK_CARDS.length);
  });

  it("renders each card headline", () => {
    render(<EditorialCardsCarousel cards={MOCK_CARDS} />);
    for (const card of MOCK_CARDS) {
      expect(screen.getByRole("heading", { level: 3, name: card.headline })).toBeInTheDocument();
    }
  });

  it("renders carousel items with slide role", () => {
    const { container } = render(<EditorialCardsCarousel cards={MOCK_CARDS} />);
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
    const { container } = render(<EditorialCardsCarousel cards={MOCK_CARDS} />);
    const prev = container.querySelector("[data-slot='carousel-previous']");
    const next = container.querySelector("[data-slot='carousel-next']");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  it("renders empty when no cards provided", () => {
    const { container } = render(<EditorialCardsCarousel cards={[]} />);
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    expect(slides).toHaveLength(0);
  });

  it("forwards colSpan as data attributes on carousel items", () => {
    const { container } = render(
      <EditorialCardsCarousel cards={MOCK_CARDS} colSpan={{ sm: 3, lg: 4 }} />
    );
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    for (const slide of slides) {
      expect(slide).toHaveAttribute("data-col-span", "3");
      expect(slide).toHaveAttribute("data-col-span-lg", "4");
    }
  });
});
