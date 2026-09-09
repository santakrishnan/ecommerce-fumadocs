/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { generateVehicleFixtures } from "~/features/search/bff/__fixtures__/vehicle-results.fixture";
import { InventoryResultsGrid } from "../inventory-results-grid";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: ({ fill, priority, loading, src, alt, ...props }: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: querySelectorAll("img") assertions require a real img element
    <img alt={(alt as string) ?? ""} height={1} src={src as string} width={1} {...props} />
  ),
}));

// ─── Fixtures ───────────────────────────────────────────────────────
const VEHICLES_14 = generateVehicleFixtures(14);
const VEHICLES_6 = generateVehicleFixtures(6);

// ─── Helpers ─────────────────────────────────────────────────────────
function getSlides(container: HTMLElement) {
  return container.querySelectorAll("[data-slot='carousel-item']");
}

// ─── Carousel region ─────────────────────────────────────────────────
describe("InventoryResultsGrid — carousel region", () => {
  it("renders a carousel region", () => {
    const { container } = render(
      <InventoryResultsGrid variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).not.toBeNull();
    expect(carousel).toHaveAttribute("role", "region");
  });

  it("applies the default aria-label", () => {
    const { container } = render(
      <InventoryResultsGrid variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).toHaveAttribute("aria-label", "Inventory results");
  });

  it("applies a custom aria-label", () => {
    const { container } = render(
      <InventoryResultsGrid
        aria-label="Search inventory"
        variant="14-cards-small"
        vehicles={VEHICLES_14}
      />
    );
    const carousel = container.querySelector("[data-slot='carousel']");
    expect(carousel).toHaveAttribute("aria-label", "Search inventory");
  });

  it("renders carousel items with slide role description", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-small" vehicles={VEHICLES_6} />
    );
    const slides = getSlides(container);
    for (const slide of slides) {
      expect(slide).toHaveAttribute("aria-roledescription", "slide");
    }
  });
});

// ─── Per-card hover ──────────────────────────────────────────────────
describe("InventoryResultsGrid — per-card hover", () => {
  it("forwards a hover-scale ratio to the carousel viewport", () => {
    const { container } = render(
      <InventoryResultsGrid size="search-fill" variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    const viewport = container.querySelector<HTMLElement>("[data-slot='carousel-content'] > div");
    expect(viewport?.style.getPropertyValue("--carousel-hover-scale-ratio")).toBe("1.025");
  });

  it("applies hover-scale classes to each card root individually", () => {
    const { container } = render(
      <InventoryResultsGrid size="search-fill" variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    const cardRoots = container.querySelectorAll("[data-slot='card-root']");
    expect(cardRoots).toHaveLength(14);
    for (const root of cardRoots) {
      expect(root.className).toContain("hover:scale-[var(--carousel-hover-scale-ratio,1)]");
      expect(root.className).toContain("transition-[transform,scale,box-shadow]");
    }
  });

  it("keeps stacked pairs scaling per card, not per column", () => {
    const { container } = render(
      <InventoryResultsGrid size="search-fill" variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    const pairColumn = getSlides(container)[1];
    const scalableInColumn = pairColumn?.querySelectorAll("[class*='hover:scale-']");
    expect(scalableInColumn).toHaveLength(2);
  });
});

// ─── Empty vehicles ──────────────────────────────────────────────────
describe("InventoryResultsGrid — empty vehicles", () => {
  it("does not render any carousel slides when vehicles is empty", () => {
    const { container } = render(<InventoryResultsGrid variant="14-cards-small" vehicles={[]} />);
    expect(getSlides(container)).toHaveLength(0);
  });
});

// ─── 14-cards-small ──────────────────────────────────────────────────
describe("InventoryResultsGrid — 14-cards-small", () => {
  it("renders 7 carousel column items for 14 vehicles", () => {
    const { container } = render(
      <InventoryResultsGrid variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    expect(getSlides(container)).toHaveLength(7);
  });

  it("renders all 14 vehicle images", () => {
    const { container } = render(
      <InventoryResultsGrid variant="14-cards-small" vehicles={VEHICLES_14} />
    );
    // next/image is mocked to a plain <img>
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(14);
  });

  it("renders each vehicle model", () => {
    render(<InventoryResultsGrid variant="14-cards-small" vehicles={VEHICLES_14} />);
    for (const vehicle of VEHICLES_14) {
      // Use exact string match to avoid false positives between "Model 1" and "Model 10" etc.
      const headings = screen.getAllByRole("heading", {
        name: new RegExp(`^${vehicle.model}`, "i"),
      });
      expect(headings.length).toBeGreaterThan(0);
    }
  });

  it("drops the last vehicle when count is odd (floor pairing)", () => {
    const oddVehicles = generateVehicleFixtures(13);
    const { container } = render(
      <InventoryResultsGrid variant="14-cards-small" vehicles={oddVehicles} />
    );
    // 13 vehicles → 6 complete pairs
    expect(getSlides(container)).toHaveLength(6);
  });
});

// ─── 6-cards-small ───────────────────────────────────────────────────
describe("InventoryResultsGrid — 6-cards-small", () => {
  it("renders 3 carousel column items for 6 vehicles", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-small" vehicles={VEHICLES_6} />
    );
    expect(getSlides(container)).toHaveLength(3);
  });

  it("renders all 6 vehicle images", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-small" vehicles={VEHICLES_6} />
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(6);
  });

  it("renders each vehicle model", () => {
    render(<InventoryResultsGrid variant="6-cards-small" vehicles={VEHICLES_6} />);
    for (const vehicle of VEHICLES_6) {
      const headings = screen.getAllByRole("heading", {
        name: new RegExp(`^${vehicle.model}`, "i"),
      });
      expect(headings.length).toBeGreaterThan(0);
    }
  });
});

// ─── 6-cards-mix ─────────────────────────────────────────────────────
describe("InventoryResultsGrid — 6-cards-mix", () => {
  it("renders 4 carousel column items: [large, small-pair, small-pair, large]", () => {
    // vehicles[0]=first(large), vehicles[1..4]=2 pairs(small), vehicles[5]=last(large)
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    expect(getSlides(container)).toHaveLength(4);
  });

  it("renders all 6 vehicle images", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(6);
  });

  it("renders each vehicle model", () => {
    render(<InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />);
    for (const vehicle of VEHICLES_6) {
      const headings = screen.getAllByRole("heading", {
        name: new RegExp(`^${vehicle.model}`, "i"),
      });
      expect(headings.length).toBeGreaterThan(0);
    }
  });

  it("renders the first vehicle as a large card (single card in the column)", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    const firstSlide = getSlides(container)[0];
    // Large column has exactly one Card element
    expect(firstSlide?.querySelectorAll("[data-slot='card']")).toHaveLength(1);
  });

  it("renders the last vehicle as a large card (single card in the column)", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    const slides = getSlides(container);
    // biome-ignore lint/style/useAtIndex: Test code is clearer with direct index access
    const lastSlide = slides[slides.length - 1];
    // Large column has exactly one Card element
    expect(lastSlide?.querySelectorAll("[data-slot='card']")).toHaveLength(1);
  });

  it("renders middle columns as stacked small-card pairs (2 cards per column)", () => {
    const { container } = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={VEHICLES_6} />
    );
    const slides = getSlides(container);
    // slides[1] and slides[2] are the middle small-pair columns
    expect(slides[1]?.querySelectorAll("[data-slot='card']")).toHaveLength(2);
    expect(slides[2]?.querySelectorAll("[data-slot='card']")).toHaveLength(2);
  });

  it("falls back to large-card columns for 1, 2, or 3 vehicles", () => {
    const oneVehicle = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={generateVehicleFixtures(1)} />
    );
    const oneSlides = getSlides(oneVehicle.container);
    expect(oneSlides).toHaveLength(1);
    for (const slide of oneSlides) {
      expect(slide.querySelectorAll("[data-slot='card']")).toHaveLength(1);
    }

    const twoVehicles = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={generateVehicleFixtures(2)} />
    );
    const twoSlides = getSlides(twoVehicles.container);
    expect(twoSlides).toHaveLength(2);
    for (const slide of twoSlides) {
      expect(slide.querySelectorAll("[data-slot='card']")).toHaveLength(1);
    }

    const threeVehicles = render(
      <InventoryResultsGrid variant="6-cards-mix" vehicles={generateVehicleFixtures(3)} />
    );
    const threeSlides = getSlides(threeVehicles.container);
    expect(threeSlides).toHaveLength(3);
    for (const slide of threeSlides) {
      expect(slide.querySelectorAll("[data-slot='card']")).toHaveLength(1);
    }
  });
});
