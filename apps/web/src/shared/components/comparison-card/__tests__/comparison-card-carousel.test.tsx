/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { ComparisonVehicle } from "../comparison-card-carousel";
import { ComparisonCardCarousel } from "../comparison-card-carousel";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: Test mock requires native img element
  // biome-ignore lint/correctness/useImageSize: Test mock doesn't need explicit dimensions
  // biome-ignore lint/a11y/useAltText: Props are spread from the component under test
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

// ─── Regex patterns ─────────────────────────────────────────────────
const HIGHLANDER_HYBRID = /HIGHLANDER HYBRID/i;
const RAV4_HYBRID = /RAV4 HYBRID/i;
const CAMRY = /CAMRY/i;
const BADGE_TEXTS = /Best for road trips|Most space/;

// ─── Fixtures ───────────────────────────────────────────────────────
const MOCK_VEHICLES: ComparisonVehicle[] = [
  {
    id: "highlander-hybrid",
    title: "HIGHLANDER HYBRID",
    year: 2024,
    description: "Goes the furthest on a single tank.",
    imageUrl: "/images/search/highlander-hybrid-2024.png",
    badgeLabel: "Best for road trips",
    metrics: [
      { label: "Range", value: "615", unit: "MI" },
      { label: "Highway MPG", value: "35" },
    ],
  },
  {
    id: "rav4-hybrid",
    title: "RAV4 HYBRID",
    year: 2024,
    description: "Compact SUV with great efficiency.",
    imageUrl: "/images/search/rav4-hybrid-2024.png",
    badgeLabel: "Most space",
    metrics: [{ label: "Max cargo", value: "84.3", unit: "CU. FT." }],
  },
  {
    id: "camry",
    title: "CAMRY",
    year: 2024,
    description: "Mid-size sedan with excellent fuel economy.",
    imageUrl: "/images/search/camry-2024.png",
    metrics: [{ label: "Highway MPG", value: "52", unit: "MPG" }],
  },
];

// ─── Carousel rendering ─────────────────────────────────────────────

describe("ComparisonCardCarousel", () => {
  it("renders a carousel region", () => {
    const { container } = render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).not.toBeNull();
    expect(carousel).toHaveAttribute("role", "region");
  });

  it("applies default aria-label", () => {
    const { container } = render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).toHaveAttribute("aria-label", "Vehicle comparison");
  });

  it("applies custom aria-label", () => {
    const { container } = render(
      <ComparisonCardCarousel aria-label="Custom comparison" vehicles={MOCK_VEHICLES} />
    );
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).toHaveAttribute("aria-label", "Custom comparison");
  });

  it("renders one card per vehicle", () => {
    render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(MOCK_VEHICLES.length);
  });

  it("renders each vehicle title", () => {
    render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    expect(screen.getByRole("heading", { level: 3, name: HIGHLANDER_HYBRID })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: RAV4_HYBRID })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: CAMRY })).toBeInTheDocument();
  });

  it("renders carousel items with slide role description", () => {
    const { container } = render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    expect(slides).toHaveLength(MOCK_VEHICLES.length);
    for (const slide of slides) {
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    }
  });

  it("renders vehicle images with computed alt text", () => {
    render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    expect(screen.getByAltText("2024 HIGHLANDER HYBRID")).toBeInTheDocument();
    expect(screen.getByAltText("2024 RAV4 HYBRID")).toBeInTheDocument();
    expect(screen.getByAltText("2024 CAMRY")).toBeInTheDocument();
  });

  it("renders alt text without year when year is not provided", () => {
    const vehicleNoYear: ComparisonVehicle[] = [
      {
        id: "no-year",
        title: "TACOMA",
        imageUrl: "/images/tacoma.png",
        metrics: [{ label: "Towing", value: "6,800", unit: "LBS" }],
      },
    ];
    render(<ComparisonCardCarousel vehicles={vehicleNoYear} />);
    expect(screen.getByAltText("TACOMA")).toBeInTheDocument();
  });
});

// ─── Empty state ────────────────────────────────────────────────────

describe("ComparisonCardCarousel — empty", () => {
  it("renders no slides when vehicles array is empty", () => {
    const { container } = render(<ComparisonCardCarousel vehicles={[]} />);
    const slides = container.querySelectorAll("[data-slot='carousel-item']");
    expect(slides).toHaveLength(0);
  });
});

// ─── Size prop ──────────────────────────────────────────────────────

describe("ComparisonCardCarousel — size", () => {
  it("renders correct number of spec-card elements with default size", () => {
    const { container } = render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(MOCK_VEHICLES.length);
    // ComparisonCard applies its unique styling
    for (const card of cards) {
      expect(card.className).toContain("justify-center");
      expect(card.className).toContain("border-white");
    }
  });

  it("renders correct number of spec-card elements with lg size", () => {
    const { container } = render(<ComparisonCardCarousel size="lg" vehicles={MOCK_VEHICLES} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards.length).toBe(MOCK_VEHICLES.length);
    for (const card of cards) {
      expect(card.className).toContain("justify-center");
      expect(card.className).toContain("border-white");
    }
  });
});

// ─── Badge rendering ────────────────────────────────────────────────

describe("ComparisonCardCarousel — badges", () => {
  it("renders badge labels for vehicles that have them", () => {
    render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    expect(screen.getByText("Best for road trips")).toBeInTheDocument();
    expect(screen.getByText("Most space")).toBeInTheDocument();
  });

  it("does not render badge for vehicles without badgeLabel", () => {
    render(<ComparisonCardCarousel vehicles={MOCK_VEHICLES} />);
    // CAMRY has no badgeLabel — verify only 2 badge texts appear
    const badges = screen.getAllByText(BADGE_TEXTS);
    expect(badges).toHaveLength(2);
  });
});
