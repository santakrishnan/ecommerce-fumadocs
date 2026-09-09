/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { FeaturedVehiclesSkeleton } from "../components/featured-vehicles-skeleton";

const DEFAULT_TITLE = "NEW TODAY";
const DEFAULT_SUBTITLE = "Here are the latest listings I've found in the last 24 hours";

describe("FeaturedVehiclesSkeleton", () => {
  it("renders 6 card skeleton placeholders", () => {
    const { container } = render(<FeaturedVehiclesSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");

    expect(skeletons).toHaveLength(6);
  });

  it("renders loading semantics on the section landmark", () => {
    render(<FeaturedVehiclesSkeleton />);

    const section = screen.getByRole("status", { name: "Loading featured vehicles" });

    expect(section).toHaveAttribute("aria-busy", "true");
  });

  it("renders the default section header copy", () => {
    render(<FeaturedVehiclesSkeleton />);

    expect(screen.getByRole("heading", { level: 2, name: DEFAULT_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_SUBTITLE)).toBeInTheDocument();
  });

  it("uses a horizontal rail wrapper matching the carousel layout", () => {
    const { container } = render(<FeaturedVehiclesSkeleton />);
    const rail = container.querySelector(".mt-4.flex.gap-2.overflow-hidden");

    expect(rail).not.toBeNull();
  });

  it("applies the small-card skeleton shape classes to each placeholder", () => {
    const { container } = render(<FeaturedVehiclesSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");

    for (const skeleton of skeletons) {
      expect(skeleton).toHaveClass("shrink-0");
      expect(skeleton).toHaveClass("rounded-xl");
    }
  });

  it("renders a stable skeleton count across multiple renders", () => {
    const { container: firstRender } = render(<FeaturedVehiclesSkeleton />);
    const { container: secondRender } = render(<FeaturedVehiclesSkeleton />);

    expect(firstRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(6);
    expect(secondRender.querySelectorAll("[data-slot='skeleton']")).toHaveLength(6);
  });
});
