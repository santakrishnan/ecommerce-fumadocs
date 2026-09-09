/// <reference types="@testing-library/jest-dom" />
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { PersonalizedSearchSkeleton } from "../components/personalized-search-skeleton";

describe("PersonalizedSearchSkeleton", () => {
  it("renders 3 card skeleton placeholders", () => {
    const { container } = render(<PersonalizedSearchSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons).toHaveLength(3);
  });

  it("uses Carousel primitives matching the real carousel layout", () => {
    const { container } = render(<PersonalizedSearchSkeleton />);
    const carousel = container.querySelector("[data-slot='carousel']");
    const carouselContent = container.querySelector("[data-slot='carousel-content']");
    const carouselItems = container.querySelectorAll("[data-slot='carousel-item']");
    expect(carousel).not.toBeNull();
    expect(carouselContent).not.toBeNull();
    expect(carouselItems).toHaveLength(3);
  });

  it("each skeleton has rounded corners and full width", () => {
    const { container } = render(<PersonalizedSearchSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    for (const skeleton of skeletons) {
      expect(skeleton.className).toContain("rounded-xl");
      expect(skeleton.className).toContain("w-full");
    }
  });

  it("section has aria-label for loading state", () => {
    const { container } = render(<PersonalizedSearchSkeleton />);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", "Personalized search recommendations loading");
  });
});
