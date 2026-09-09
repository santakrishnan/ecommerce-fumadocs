/// <reference types="@testing-library/jest-dom" />
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { EditorialCardsSkeleton } from "../components/editorial-cards-skeleton";

describe("EditorialCardsSkeleton", () => {
  it("renders 4 card skeleton placeholders", () => {
    const { container } = render(<EditorialCardsSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons).toHaveLength(4);
  });

  it("uses a horizontal flex layout matching the carousel", () => {
    const { container } = render(<EditorialCardsSkeleton />);
    const flexWrapper = container.querySelector(".flex.gap-2.overflow-hidden");
    expect(flexWrapper).not.toBeNull();
  });

  it("each skeleton is shrink-0 with rounded corners", () => {
    const { container } = render(<EditorialCardsSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    for (const skeleton of skeletons) {
      expect(skeleton.className).toContain("shrink-0");
      expect(skeleton.className).toContain("rounded-xl");
    }
  });

  it("section has aria-label for loading state", () => {
    const { container } = render(<EditorialCardsSkeleton />);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", "Curated collections loading");
  });

  it("renders consistent skeleton count across multiple renders", () => {
    const { container: firstRender } = render(<EditorialCardsSkeleton />);
    const { container: secondRender } = render(<EditorialCardsSkeleton />);
    expect(firstRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(4);
    expect(secondRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(4);
  });
});
