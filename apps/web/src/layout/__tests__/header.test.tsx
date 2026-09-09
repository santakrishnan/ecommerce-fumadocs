import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { Header } from "../header";

// ─── Mocks ──────────────────────────────────────────────────────────
// Isolate Header from child-component implementations (localStorage, geolocation, etc.)
vi.mock("@shared/components/navigation-bar", () => ({
  NavigationBar: () => null,
}));

vi.mock("@features/location", () => ({
  LocationPillSkeleton: () => null,
}));

vi.mock("@features/location/server", () => ({
  LocationPillWrapper: () => null,
}));

const MAIN_NAV_PATTERN = /main navigation/i;

describe("Header", () => {
  it("renders a banner landmark", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("contains the main navigation landmark", () => {
    render(<Header />);
    expect(screen.getByRole("navigation", { name: MAIN_NAV_PATTERN })).toBeInTheDocument();
  });

  it("lays the nav row out on the shared page grid", () => {
    render(<Header />);
    const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
    expect(navigation).toHaveAttribute("data-slot", "page-grid");
  });

  it("is fixed positioned at the top", () => {
    render(<Header />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("fixed");
    expect(banner.className).toContain("top-0");
  });

  it("applies responsive height — h-24 on mobile, lg:h-30 on desktop", () => {
    render(<Header />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("h-24");
    expect(banner.className).toContain("lg:h-30");
  });

  it("applies the page-grid horizontal margins to the nav row", () => {
    render(<Header />);
    const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
    expect(navigation.className).toContain("px-(--page-grid-margin)");
  });

  it("disables pointer events on the header wrapper so the transparent middle lane is click-through", () => {
    render(<Header />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("pointer-events-none");
  });

  it("re-enables pointer events on both interactive zones (default — with nav and location pill)", () => {
    render(<Header />);
    const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
    expect(navigation.querySelectorAll(".pointer-events-auto")).toHaveLength(2);
  });

  describe("locationSlot prop", () => {
    it("renders the location pill by default", () => {
      render(<Header />);
      const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
      expect(navigation.querySelectorAll(".pointer-events-auto")).toHaveLength(2);
    });

    it("hides the location slot when locationSlot={null}", () => {
      render(<Header locationSlot={null} />);
      const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
      expect(navigation.querySelectorAll(".pointer-events-auto")).toHaveLength(1);
    });

    it("renders custom locationSlot content in the right zone", () => {
      render(<Header locationSlot={<span data-testid="custom-slot">Custom</span>} />);
      expect(screen.getByTestId("custom-slot")).toBeInTheDocument();
    });
  });

  describe("navSlot prop", () => {
    it("renders custom navSlot content in the left zone", () => {
      render(<Header locationSlot={null} navSlot={<span data-testid="custom-nav">Back</span>} />);
      expect(screen.getByTestId("custom-nav")).toBeInTheDocument();
    });

    it("hides the nav zone when navSlot={null}", () => {
      render(<Header locationSlot={null} navSlot={null} />);
      const navigation = screen.getByRole("navigation", { name: MAIN_NAV_PATTERN });
      expect(navigation.querySelectorAll(".pointer-events-auto")).toHaveLength(0);
    });
  });
});
