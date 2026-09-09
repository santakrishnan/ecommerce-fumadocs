import type { Vehicle } from "@shared/components/inventory-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { ContinueShoppingVdpCarousel } from "../continue-shopping-vdp-carousel";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeVehicles(count: number, prefix = "v"): Vehicle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    make: "Toyota",
    model: "Camry",
    year: 2024,
    trim: "SE",
    price: 28_000 + i * 1000,
    mileage: 10_000 + i * 500,
    imageUrl: `/img/${prefix}-${i + 1}.png`,
    surface: "light" as const,
  }));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ContinueShoppingVdpCarousel", () => {
  describe("empty state", () => {
    it("renders nothing when recentlyViewed is empty and not loading", () => {
      const { container } = render(<ContinueShoppingVdpCarousel recentlyViewed={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("does not render when recentlyViewed is empty and isLoading is false", () => {
      const { container } = render(
        <ContinueShoppingVdpCarousel isLoading={false} recentlyViewed={[]} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("renders correctly with vehicles", () => {
    it("renders the section with aria-label", () => {
      const vehicles = makeVehicles(3);
      render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      expect(screen.getByLabelText("Continue shopping")).toBeInTheDocument();
    });

    it("renders CONTINUE SHOPPING heading", () => {
      const vehicles = makeVehicles(3);
      render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      expect(screen.getByText("CONTINUE SHOPPING")).toBeInTheDocument();
    });

    it("renders subtitle text", () => {
      const vehicles = makeVehicles(2);
      render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      expect(
        screen.getByText("Pick up where you left off while they are still available")
      ).toBeInTheDocument();
    });

    it("renders all vehicles passed without capping", () => {
      const vehicles = makeVehicles(8);
      const { container } = render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      const carouselItems = container.querySelectorAll('[data-slot="carousel-item"]');
      expect(carouselItems).toHaveLength(8);
    });

    it("renders a single vehicle correctly", () => {
      const vehicles = makeVehicles(1);
      const { container } = render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      const carouselItems = container.querySelectorAll('[data-slot="carousel-item"]');
      expect(carouselItems).toHaveLength(1);
    });
  });

  describe("loading state", () => {
    it("renders skeleton items when loading", () => {
      render(<ContinueShoppingVdpCarousel isLoading recentlyViewed={[]} />);

      expect(screen.getByLabelText("Continue shopping")).toBeInTheDocument();
      expect(screen.getByText("CONTINUE SHOPPING")).toBeInTheDocument();
    });

    it("renders section during loading even with empty vehicles", () => {
      const { container } = render(<ContinueShoppingVdpCarousel isLoading recentlyViewed={[]} />);

      expect(container.querySelector("section")).toBeInTheDocument();
    });
  });

  describe("className forwarding", () => {
    it("applies className to the outer section", () => {
      const vehicles = makeVehicles(2);
      const { container } = render(
        <ContinueShoppingVdpCarousel className="custom-class" recentlyViewed={vehicles} />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("does not render wrapper when empty and not loading", () => {
      const { container } = render(
        <ContinueShoppingVdpCarousel className="custom-class" recentlyViewed={[]} />
      );

      expect(container.querySelector(".custom-class")).toBeNull();
    });
  });

  describe("no New Today group", () => {
    it("does not render any NEW TODAY heading", () => {
      const vehicles = makeVehicles(5);
      render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      expect(screen.queryByText("NEW TODAY")).not.toBeInTheDocument();
    });

    it("renders only a single carousel group", () => {
      const vehicles = makeVehicles(5);
      const { container } = render(<ContinueShoppingVdpCarousel recentlyViewed={vehicles} />);

      const groups = container.querySelectorAll('[data-slot="carousel-group"]');
      expect(groups).toHaveLength(1);
    });
  });
});
