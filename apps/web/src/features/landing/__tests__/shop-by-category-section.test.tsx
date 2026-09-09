/// <reference types="@testing-library/jest-dom" />
import { getBrowseByStyleResponse } from "@features/landing/bff/services/get-browse-by-style-response";
import type { BrowseByStyleCard } from "@features/landing/contracts/browse-by-style.schema";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShopByCategorySection } from "../components/shop-by-category-section";

// Browse By Style is the source of truth — mock the resolver, not raw data.
vi.mock("@features/landing/bff/services/get-browse-by-style-response", () => ({
  getBrowseByStyleResponse: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src }: { src?: string }) => <div data-src={src} data-testid="image" />,
}));

const mockResolver = vi.mocked(getBrowseByStyleResponse);

function makeCard(
  categoryKey: string,
  title: string,
  description: string,
  imageSrc = `http://localhost:3000/images/categories/${categoryKey}.png`
): BrowseByStyleCard {
  return {
    id: `style-${categoryKey}`,
    cardType: "style-category",
    categoryKey,
    title,
    description,
    image: { src: imageSrc, alt: `${title} image` },
    cta: { label: `Shop ${title}` },
    action: {
      id: `action-${categoryKey}`,
      type: "navigate-to-search",
      target: "/search",
      seed: { categoryKey, label: title },
    },
  };
}

const ITEMS: BrowseByStyleCard[] = [
  makeCard("car", "CARS & MINIVANS", "Cars description"),
  makeCard("truck", "TRUCKS", "Trucks description"),
];

function successResponse(items: BrowseByStyleCard[]) {
  return {
    title: "BROWSE BY STYLE",
    subtitle: "Get started with what matters most to you",
    items,
    meta: { source: "static" as const },
  };
}

beforeEach(() => {
  mockResolver.mockReset();
});

describe("ShopByCategorySection", () => {
  it("renders the SectionHeader (title + subtitle) from the response", () => {
    mockResolver.mockReturnValue(successResponse(ITEMS));
    const { container } = render(<ShopByCategorySection />);

    expect(container.querySelector("div.mb-4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "BROWSE BY STYLE" })).toBeInTheDocument();
    expect(screen.getByText("Get started with what matters most to you")).toBeInTheDocument();
  });

  it("renders a CategoryCarousel with all cards", () => {
    mockResolver.mockReturnValue(successResponse(ITEMS));
    const { container } = render(<ShopByCategorySection />);

    expect(container.querySelector("[data-slot='carousel']")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-slot='carousel-item']")).toHaveLength(ITEMS.length);
    for (const card of ITEMS) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
      expect(screen.getByText(card.description ?? "")).toBeInTheDocument();
    }
  });

  it("maps the shop link from the card action (target + categoryKey)", () => {
    mockResolver.mockReturnValue(successResponse(ITEMS));
    render(<ShopByCategorySection />);

    expect(screen.getByRole("link", { name: "Shop TRUCKS" })).toHaveAttribute(
      "href",
      "/search?type=truck"
    );
  });

  it("renders nothing (null) when there are no items — section absent from DOM", () => {
    mockResolver.mockReturnValue(successResponse([]));
    const { container } = render(<ShopByCategorySection />);

    expect(container.querySelector("section")).not.toBeInTheDocument();
    expect(container.querySelector("[data-slot='carousel']")).not.toBeInTheDocument();
  });

  it("renders nothing (null) on a validation error response — section absent from DOM", () => {
    mockResolver.mockReturnValue({
      error: {
        code: "BROWSE_BY_STYLE_VALIDATION_FAILED",
        message: "bad",
        details: { source: "getBrowseByStyleResponse" },
      },
    });
    const { container } = render(<ShopByCategorySection />);

    expect(container.querySelector("section")).not.toBeInTheDocument();
    expect(container.querySelector("[data-slot='carousel']")).not.toBeInTheDocument();
  });

  it("strips localhost origin from image URLs (dev parity)", () => {
    const cards = [
      makeCard(
        "car",
        "CARS",
        "Cars description",
        "http://localhost:3000/images/categories/car.png"
      ),
    ];
    mockResolver.mockReturnValue(successResponse(cards));
    render(<ShopByCategorySection />);

    const image = screen.getByTestId("image");
    expect(image).toHaveAttribute("data-src", "/images/categories/car.png");
  });

  it("preserves external (non-localhost) absolute URLs", () => {
    const externalUrl = "https://cdn.example.com/images/categories/truck.png";
    const cards = [makeCard("truck", "TRUCKS", "Trucks description", externalUrl)];
    mockResolver.mockReturnValue(successResponse(cards));
    render(<ShopByCategorySection />);

    const image = screen.getByTestId("image");
    expect(image).toHaveAttribute("data-src", externalUrl);
  });

  it("filters out cards without an image src", () => {
    const cardWithoutImage: BrowseByStyleCard = {
      id: "style-noimg",
      cardType: "style-category",
      categoryKey: "noimg",
      title: "NO IMAGE",
      description: "Should be filtered",
      image: undefined,
      cta: { label: "Shop" },
      action: {
        id: "action-noimg",
        type: "navigate-to-search",
        target: "/search",
        seed: { categoryKey: "noimg", label: "NO IMAGE" },
      },
    };
    mockResolver.mockReturnValue(successResponse([...ITEMS, cardWithoutImage]));
    const { container } = render(<ShopByCategorySection />);

    expect(container.querySelectorAll("[data-slot='carousel-item']")).toHaveLength(ITEMS.length);
    expect(screen.queryByText("NO IMAGE")).not.toBeInTheDocument();
  });
});
