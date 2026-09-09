import { ContinueShoppingCarousel } from "@features/landing/components/continue-shopping/continue-shopping-carousel";
import type { Vehicle } from "@shared/components/inventory-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

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

const NEW_TODAY: Vehicle[] = makeVehicles(3, "new");

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ContinueShoppingCarousel", () => {
  describe("UC-4: N = 0 (no recently viewed)", () => {
    it("renders New Today only when no recently viewed vehicles", () => {
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={[]} />);

      expect(screen.getByLabelText("New listings")).toBeInTheDocument();
      expect(screen.queryByLabelText("Continue shopping and new listings")).not.toBeInTheDocument();
    });

    it("renders nothing when both recently viewed and new today are empty", () => {
      const { container } = render(<ContinueShoppingCarousel newToday={[]} recentlyViewed={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("UC-1: N = 1–2 (few recently viewed)", () => {
    it("renders Continue Shopping group with 1 vehicle", () => {
      const recent = makeVehicles(1, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByLabelText("Continue shopping and new listings")).toBeInTheDocument();
      // Both mobile and desktop render "CONTINUE SHOPPING"
      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
    });

    it("renders New Today group alongside CS for N=1", () => {
      const recent = makeVehicles(1, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      // Desktop track has new-today-group
      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
      // Mobile track has new-today-group-mobile
      expect(screen.getByTestId("new-today-group-mobile")).toBeInTheDocument();
      expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
    });

    it("renders New Today group alongside CS for N=2", () => {
      const recent = makeVehicles(2, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
    });
  });

  describe("UC-2: N = 3–4 (moderate recently viewed)", () => {
    it("renders New Today group alongside CS for N=3", () => {
      const recent = makeVehicles(3, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
      expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
    });

    it("renders New Today group alongside CS for N=4", () => {
      const recent = makeVehicles(4, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
    });
  });

  describe("UC-3: N >= 5 (many recently viewed — New Today always shown)", () => {
    it("always renders New Today group alongside CS when N=5", () => {
      const recent = makeVehicles(5, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
      expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
    });

    it("always renders New Today group alongside CS when N=8", () => {
      const recent = makeVehicles(8, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByTestId("new-today-group")).toBeInTheDocument();
      expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("UC-5: loading state", () => {
    it("renders skeleton placeholders when loading", () => {
      render(<ContinueShoppingCarousel isLoading newToday={NEW_TODAY} recentlyViewed={[]} />);

      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText("Continue shopping and new listings")).toBeInTheDocument();
    });
  });

  describe("UC-6: sticky header", () => {
    it("renders with stickyHeader prop enabled without errors", () => {
      const recent = makeVehicles(2, "recent");
      render(
        <ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} stickyHeader />
      );

      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
    });

    it("renders without stickyHeader (default false) without errors", () => {
      const recent = makeVehicles(2, "recent");
      render(
        <ContinueShoppingCarousel
          newToday={NEW_TODAY}
          recentlyViewed={recent}
          stickyHeader={false}
        />
      );

      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("New Today not rendered when empty", () => {
    it("does not render New Today group when newToday array is empty", () => {
      const recent = makeVehicles(2, "recent");
      render(<ContinueShoppingCarousel newToday={[]} recentlyViewed={recent} />);

      expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByTestId("new-today-group")).not.toBeInTheDocument();
      expect(screen.queryByTestId("new-today-group-mobile")).not.toBeInTheDocument();
    });
  });

  describe("Desktop 3-card cap", () => {
    it("renders only 3 vehicle cards in the desktop carousel even when more are available", () => {
      const recent = makeVehicles(7, "recent");
      const { container } = render(
        <ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />
      );

      // The desktop track (hidden md:block) should contain max 3 CS cards
      const desktopTrack = container.querySelector(".hidden.md\\:block");
      expect(desktopTrack).toBeInTheDocument();

      // Desktop carousel group should have exactly 3 recently-viewed carousel items
      // (the first group in the desktop track is CS)
      const desktopGroups = desktopTrack?.querySelectorAll('[data-slot="carousel-group"]');
      const csGroup = desktopGroups?.[0];
      expect(csGroup).toBeDefined();
      const csItems = csGroup?.querySelectorAll('[data-slot="carousel-item"]');
      expect(csItems).toHaveLength(3);
    });

    it("mobile layout shows all recently viewed vehicles (no cap)", () => {
      const recent = makeVehicles(7, "recent");
      const { container } = render(
        <ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />
      );

      // Mobile layout shows all 7 vehicles
      const mobileTrack = container.querySelector(".flex.flex-col.gap-8.md\\:hidden");
      expect(mobileTrack).toBeInTheDocument();

      // First section in mobile is CS — should have all 7 items
      const mobileGroups = mobileTrack?.querySelectorAll('[data-slot="carousel-group"]');
      const csGroup = mobileGroups?.[0];
      expect(csGroup).toBeDefined();
      const csItems = csGroup?.querySelectorAll('[data-slot="carousel-item"]');
      expect(csItems).toHaveLength(7);
    });
  });

  describe("Mobile stacked layout", () => {
    it("renders mobile stacked layout with New Today below CS", () => {
      const recent = makeVehicles(5, "recent");
      render(<ContinueShoppingCarousel newToday={NEW_TODAY} recentlyViewed={recent} />);

      expect(screen.getByTestId("new-today-group-mobile")).toBeInTheDocument();
    });

    it("does not render mobile New Today when newToday is empty", () => {
      const recent = makeVehicles(5, "recent");
      render(<ContinueShoppingCarousel newToday={[]} recentlyViewed={recent} />);

      expect(screen.queryByTestId("new-today-group-mobile")).not.toBeInTheDocument();
    });
  });
});
