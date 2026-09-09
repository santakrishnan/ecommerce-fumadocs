/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { ContinueShoppingSkeleton } from "../components/continue-shopping";

describe("ContinueShoppingSkeleton", () => {
  it("renders 8 skeleton placeholders (2 text bars + 6 card shapes)", () => {
    const { container } = render(<ContinueShoppingSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");

    expect(skeletons).toHaveLength(8);
  });

  it("renders loading semantics on the section landmark", () => {
    render(<ContinueShoppingSkeleton />);

    const section = screen.getByRole("status", { name: "Loading continue shopping" });

    expect(section).toHaveAttribute("aria-busy", "true");
  });

  it("renders shape-only placeholders instead of real text (avoids subtitle flash)", () => {
    const { container } = render(<ContinueShoppingSkeleton />);

    // Title and subtitle are now Skeleton bars, not real text
    const headerArea = container.querySelector(".mb-4");
    expect(headerArea).not.toBeNull();
    if (!headerArea) {
      throw new Error("header area not found");
    }
    const headerSkeletons = headerArea.querySelectorAll("[data-slot='skeleton']");
    expect(headerSkeletons).toHaveLength(2);
  });

  it("uses the horizontal rail layout for card skeletons", () => {
    const { container } = render(<ContinueShoppingSkeleton />);
    const rail = container.querySelector(".flex.gap-2.overflow-hidden");

    expect(rail).not.toBeNull();
  });

  it("applies the small-card skeleton shape classes to card placeholders", () => {
    const { container } = render(<ContinueShoppingSkeleton />);
    const rail = container.querySelector(".flex.gap-2.overflow-hidden");
    expect(rail).not.toBeNull();
    if (!rail) {
      throw new Error("rail not found");
    }
    const cardSkeletons = rail.querySelectorAll("[data-slot='skeleton']");

    expect(cardSkeletons).toHaveLength(6);
    for (const skeleton of cardSkeletons) {
      expect(skeleton).toHaveClass("shrink-0");
      expect(skeleton).toHaveClass("rounded-xl");
    }
  });

  it("renders a stable skeleton count across multiple renders", () => {
    const { container: firstRender } = render(<ContinueShoppingSkeleton />);
    const { container: secondRender } = render(<ContinueShoppingSkeleton />);

    expect(firstRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(8);
    expect(secondRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(8);
  });
});
