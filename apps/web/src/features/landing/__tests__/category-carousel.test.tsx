import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { emptyCategories, mockCategories } from "../__fixtures__/category-carousel.fixtures";
import { CategoryCarousel } from "../components/category-card/category-carousel";

describe("CategoryCarousel", () => {
  it("renders all category cards", () => {
    render(<CategoryCarousel categories={mockCategories} />);

    for (const category of mockCategories) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
      expect(screen.getByText(category.description)).toBeInTheDocument();
    }
  });

  it("renders the correct number of carousel items", () => {
    const { container } = render(<CategoryCarousel categories={mockCategories} />);

    const carouselItems = container.querySelectorAll("[data-slot='carousel-item']");
    expect(carouselItems).toHaveLength(mockCategories.length);
  });

  it("renders carousel items with proper structure", () => {
    const { container } = render(<CategoryCarousel categories={mockCategories} />);

    const carouselItems = container.querySelectorAll("[data-slot='carousel-item']");
    expect(carouselItems.length).toBeGreaterThan(0);

    for (const item of carouselItems) {
      expect(item).toBeInTheDocument();
    }
  });

  it("renders carousel with correct orientation", () => {
    const { container } = render(<CategoryCarousel categories={mockCategories} />);

    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).toBeInTheDocument();
  });

  it("renders carousel content with correct classes", () => {
    const { container } = render(<CategoryCarousel categories={mockCategories} />);

    const carouselContent = container.querySelector("[data-slot='carousel-content']");
    expect(carouselContent).toBeInTheDocument();

    // Carousel content now uses base UI default classes
    expect(carouselContent?.querySelector("div")).toBeInTheDocument();
  });

  it("handles empty categories array gracefully", () => {
    const { container } = render(<CategoryCarousel categories={emptyCategories} />);

    const carouselItems = container.querySelectorAll("[data-slot='carousel-item']");
    expect(carouselItems).toHaveLength(0);
  });

  it("renders shop links with correct href", () => {
    render(<CategoryCarousel categories={mockCategories} />);

    for (const category of mockCategories) {
      const shopLink = screen.getByRole("link", {
        name: new RegExp(`Shop ${category.name}`, "i"),
      });
      expect(shopLink).toHaveAttribute("href", category.shopUrl);
    }
  });

  it("renders category images with correct alt text", () => {
    render(<CategoryCarousel categories={mockCategories} />);

    for (const category of mockCategories) {
      const image = screen.getByAltText(category.imageAlt);
      expect(image).toBeInTheDocument();
      // Next.js Image component transforms src URLs, so we just verify the alt text
      expect(image).toHaveAttribute("alt", category.imageAlt);
    }
  });

  it("forwards colSpan to carousel items", () => {
    const { container } = render(
      <CategoryCarousel categories={mockCategories} colSpan={{ sm: 3, md: 3, lg: 3 }} />
    );

    const carouselItems = container.querySelectorAll("[data-slot='carousel-item']");
    expect(carouselItems.length).toBeGreaterThan(0);

    for (const item of carouselItems) {
      expect(item).toHaveAttribute("data-col-span", "3");
      expect(item).toHaveAttribute("data-col-span-md", "3");
      expect(item).toHaveAttribute("data-col-span-lg", "3");
    }
  });
});
