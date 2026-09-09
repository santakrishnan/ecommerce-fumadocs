/// <reference types="@testing-library/jest-dom/vitest" />
import { CarouselGroupLabel } from "@ucmp/ui";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("CarouselGroupLabel", () => {
  describe("title rendering", () => {
    it('renders title text with data-slot="carousel-group-label"', () => {
      const { container } = render(
        <CarouselGroupLabel title="More matches" />
      );
      const el = container.querySelector(
        '[data-slot="carousel-group-label"]'
      );
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent("More matches");
    });
  });

  describe("subtitle rendering", () => {
    it("renders subtitle when title is present", () => {
      render(
        <CarouselGroupLabel title="More matches" subtitle="Based on your search" />
      );
      expect(screen.getByText("More matches")).toBeInTheDocument();

      const subtitle = screen.getByText("Based on your search");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass("body-md", "text-text-secondary");
      expect(subtitle).not.toHaveClass("body-sm", "xl:body-md", "lg:disclaimer");
    });
  });

  describe("empty state", () => {
    it("renders nothing when no title provided", () => {
      const { container } = render(<CarouselGroupLabel />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("className passthrough", () => {
    it("accepts and applies className", () => {
      const { container } = render(
        <CarouselGroupLabel title="Test" className="mt-4" />
      );
      const el = container.querySelector(
        '[data-slot="carousel-group-label"]'
      );
      expect(el).toHaveClass("mt-4");
    });
  });

  describe("HTML attribute spread", () => {
    it("spreads additional HTML attributes", () => {
      const { container } = render(
        <CarouselGroupLabel
          title="Test"
          data-testid="custom-label"
          aria-label="group label"
        />
      );
      const el = container.querySelector(
        '[data-slot="carousel-group-label"]'
      );
      expect(el).toHaveAttribute("data-testid", "custom-label");
      expect(el).toHaveAttribute("aria-label", "group label");
    });
  });

  describe("no title renders nothing", () => {
    it("renders nothing when no title provided", () => {
      const { container } = render(
        <CarouselGroupLabel title="" />
      );
      expect(container.innerHTML).toBe("");
    });
  });
});
