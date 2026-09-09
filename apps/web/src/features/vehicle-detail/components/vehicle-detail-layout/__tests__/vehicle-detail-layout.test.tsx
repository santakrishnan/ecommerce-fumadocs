/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { VehicleDetailLayout } from "../vehicle-detail-layout";

vi.mock("@ucmp/ui", () => ({
  PageGrid: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} data-testid="page-grid" {...props}>
      {children}
    </div>
  ),
}));

const defaultSlots = {
  hero: <div data-testid="slot-hero">Hero</div>,
  description: <div data-testid="slot-description">Description</div>,
  detailCards: <div data-testid="slot-detail-cards">Detail Cards</div>,
  specs: <div data-testid="slot-specs">Specs</div>,
  rightRail: <div data-testid="slot-right-rail">Right Rail</div>,
  whyBuy: <div data-testid="slot-why-buy">Why Buy</div>,
};

describe("VehicleDetailLayout", () => {
  describe("Slot rendering", () => {
    it("renders the hero slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-hero")).toBeInTheDocument();
    });

    it("renders the description slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-description")).toBeInTheDocument();
    });

    it("renders the detailCards slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-detail-cards")).toBeInTheDocument();
    });

    it("renders the specs slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-specs")).toBeInTheDocument();
    });

    it("renders the rightRail slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-right-rail")).toBeInTheDocument();
    });

    it("renders the whyBuy slot", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      expect(screen.getByTestId("slot-why-buy")).toBeInTheDocument();
    });

    it("renders the whyBuy slot content in the bottom section", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      const whyBuy = screen.getByTestId("slot-why-buy");
      expect(whyBuy).toBeInTheDocument();
      expect(whyBuy.closest('[data-section="why-buy"]')).toBeInTheDocument();
    });
  });

  describe("Layout structure", () => {
    it("wraps the layout with data-layout attribute", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const layout = container.querySelector('[data-layout="vehicle-detail-page"]');
      expect(layout).toBeInTheDocument();
    });

    it("renders the hero background in a fixed container", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const heroBg = container.querySelector('[data-slot="hero-background"]');
      expect(heroBg).toBeInTheDocument();
      expect(heroBg).toHaveClass("fixed", "inset-0", "z-0", "h-dvh", "overflow-hidden");
    });

    it("renders the body region with z-index for layering above hero", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const bodyRegion = container.querySelector('[data-region="body-two-column"]');
      expect(bodyRegion).toBeInTheDocument();
      expect(bodyRegion).toHaveClass("z-1");
    });

    it("renders the two-column body region", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const bodyRegion = container.querySelector('[data-region="body-two-column"]');
      expect(bodyRegion).toBeInTheDocument();
    });

    it("renders the right rail aside with correct data attribute", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const rightRail = container.querySelector('[data-column="right-rail"]');
      expect(rightRail).toBeInTheDocument();
      expect(rightRail?.tagName).toBe("ASIDE");
    });

    it("applies sticky positioning with header-aligned offset on desktop", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const rightRail = container.querySelector('[data-column="right-rail"]');
      expect(rightRail).toBeInTheDocument();
      expect(rightRail).toHaveClass("lg:sticky");
      expect(rightRail).toHaveClass("lg:top-8");
      expect(rightRail).toHaveClass("xl:top-[5.5rem]");
      expect(rightRail).toHaveClass("lg:self-start");
    });

    it("applies max-height with overflow scroll for long content on desktop", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const rightRail = container.querySelector('[data-column="right-rail"]');
      expect(rightRail).toBeInTheDocument();
      expect(rightRail).toHaveClass("lg:top-8");
      expect(rightRail).toHaveClass("lg:max-h-[calc(100dvh-2rem)]");
      expect(rightRail).toHaveClass("xl:max-h-[calc(100dvh-5.5rem)]");
      expect(rightRail).toHaveClass("lg:overflow-y-auto");
      expect(rightRail).toHaveClass("lg:scrollbar-none");
    });

    it("renders the left column main with correct data attribute", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const leftCol = container.querySelector('[data-column="left"]');
      expect(leftCol).toBeInTheDocument();
      expect(leftCol?.tagName).toBe("MAIN");
    });

    it("renders description, detailCards, and specs sections inside the left column", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const leftCol = container.querySelector('[data-column="left"]');
      expect(leftCol?.querySelector('[data-section="description"]')).toBeInTheDocument();
      expect(leftCol?.querySelector('[data-section="detail-cards"]')).toBeInTheDocument();
      expect(leftCol?.querySelector('[data-section="specs"]')).toBeInTheDocument();
    });

    it("renders the bottom full-width region", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const bottomRegion = container.querySelector('[data-region="bottom-full-width"]');
      expect(bottomRegion).toBeInTheDocument();
      expect(bottomRegion).toHaveClass("z-1", "bg-surface-secondary");
    });

    it("renders the why-buy section with full-width breakout wrapper", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const whyBuySection = container.querySelector('[data-section="why-buy"]');
      expect(whyBuySection).toBeInTheDocument();
      expect(whyBuySection).toHaveClass("px-0", "lg:px-10");
    });

    it("renders the why-buy section inside the bottom region", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const bottomRegion = container.querySelector('[data-region="bottom-full-width"]');
      const whyBuySection = bottomRegion?.querySelector('[data-section="why-buy"]');
      expect(whyBuySection).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders a main landmark for the left column content", () => {
      render(<VehicleDetailLayout {...defaultSlots} />);
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("renders an aside landmark for the right rail", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const aside = container.querySelector("aside");
      expect(aside).toBeInTheDocument();
    });

    it("hides the hero spacer from assistive technology", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const spacer = container.querySelector('[aria-hidden="true"]');
      expect(spacer).toBeInTheDocument();
      expect(spacer).toHaveClass("col-span-full", "aspect-[16/9]", "lg:h-0");
    });
  });

  describe("Why Buy section max-width constraint", () => {
    it("wraps why-buy content in a PageGrid with edge-to-edge mobile padding", () => {
      const { container } = render(<VehicleDetailLayout {...defaultSlots} />);
      const whyBuySection = container.querySelector('[data-section="why-buy"]');
      expect(whyBuySection).toBeInTheDocument();
      expect(whyBuySection).toHaveClass("px-0", "lg:px-10");
    });
  });
});
