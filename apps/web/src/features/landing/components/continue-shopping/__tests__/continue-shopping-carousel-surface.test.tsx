import { ContinueShoppingCarousel } from "@features/landing/components/continue-shopping/continue-shopping-carousel";
import type { Vehicle } from "@shared/components/inventory-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/image to render a native <img> that fires onLoad.
vi.mock("next/image", () => ({
  default: ({ src, alt, onLoad, className }: any) => (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Test mock needs onLoad for GradientImage sampling
    // biome-ignore lint/performance/noImgElement: Test mock requires native img element
    // biome-ignore lint/correctness/useImageSize: Test mock doesn't need explicit dimensions
    <img alt={alt} className={className} data-testid="gradient-img" onLoad={onLoad} src={src} />
  ),
}));

// Mock sampleBottomAverageColor to return a controlled oklch() color string.
vi.mock("@/lib/bottom-strip-sampling", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bottom-strip-sampling")>();
  return {
    ...actual,
    sampleBottomAverageColor: vi.fn(() => "oklch(30% 0.1 250)"),
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "v-1",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    trim: "SE",
    price: 28_000,
    mileage: 10_000,
    imageUrl: "/img/v-1.png",
    ...overrides,
  };
}

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
  }));
}

function dispatchLandscapeImageLoad(img: HTMLImageElement) {
  // 16:9 landscape — wider than card ratio (178/237 ≈ 0.75)
  Object.defineProperty(img, "naturalWidth", { value: 1600, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: 900, configurable: true });
  act(() => {
    img.dispatchEvent(new Event("load", { bubbles: true }));
  });
}

function dispatchPortraitImageLoad(img: HTMLImageElement) {
  // Portrait — taller than card ratio, so image fills the frame
  Object.defineProperty(img, "naturalWidth", { value: 600, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: 900, configurable: true });
  act(() => {
    img.dispatchEvent(new Event("load", { bubbles: true }));
  });
}

afterEach(() => {
  document.documentElement.style.removeProperty("--carcutter-gradient-color");
  vi.clearAllMocks();
});

// ─── QA: data-surface assignment ────────────────────────────────────────────

describe("ContinueShoppingCarousel — data-surface assignment", () => {
  it('defaults data-surface to "dark" before image load (gradient variant fallback)', () => {
    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    const cardRoot = container.querySelector('[data-slot="card-root"]');
    expect(cardRoot).toBeInTheDocument();
    expect(cardRoot).toHaveAttribute("data-surface", "dark");
  });

  it('sets data-surface="dark" on card root after onColorSampled fires with a dark oklch color', async () => {
    document.documentElement.style.setProperty("--carcutter-gradient-color", "oklch(30% 0.1 250)");

    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    const img = container.querySelector('[data-testid="gradient-img"]') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    dispatchLandscapeImageLoad(img);

    const cardRoot = container.querySelector('[data-slot="card-root"]');
    expect(cardRoot).toHaveAttribute("data-surface", "dark");
  });

  it("sets data-surface to light when overrideColor resolves to a light OKLCH color", () => {
    document.documentElement.style.setProperty("--carcutter-gradient-color", "oklch(80% 0.05 100)");

    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    const img = container.querySelector('[data-testid="gradient-img"]') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    dispatchLandscapeImageLoad(img);

    const cardRoot = container.querySelector('[data-slot="card-root"]');
    expect(cardRoot).toHaveAttribute("data-surface", "light");
  });
});

// ─── QA: Landscape image — gradient fill ────────────────────────────────────

describe("ContinueShoppingCarousel — landscape image", () => {
  it("renders gradient-image-blend (gradient fill) when image is wider than frame", () => {
    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    const img = container.querySelector('[data-testid="gradient-img"]') as HTMLImageElement;
    dispatchLandscapeImageLoad(img);

    // GradientImage renders blend elements when image doesn't fill frame
    const blendElements = container.querySelectorAll('[data-slot="gradient-image-blend"]');
    expect(blendElements.length).toBeGreaterThan(0);
  });

  it("image is positioned at top of the frame (object-top via GradientImage media slot)", () => {
    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    // The media container has top-0 class (top-aligned)
    const mediaSlot = container.querySelector('[data-slot="gradient-image-media"]');
    expect(mediaSlot).toBeInTheDocument();
    expect(mediaSlot).toHaveClass("top-0");
  });
});

// ─── QA: Portrait/square image — no gradient ────────────────────────────────

describe("ContinueShoppingCarousel — portrait image", () => {
  it("does not render gradient-image-blend when image fills the frame", () => {
    const vehicles = [makeVehicle()];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    const img = container.querySelector('[data-testid="gradient-img"]') as HTMLImageElement;
    dispatchPortraitImageLoad(img);

    const blendElements = container.querySelectorAll('[data-slot="gradient-image-blend"]');
    expect(blendElements.length).toBe(0);
  });
});

// ─── QA: Loading state ──────────────────────────────────────────────────────

describe("ContinueShoppingCarousel — loading state", () => {
  it("renders skeleton items in the CS group when isLoading=true without errors", () => {
    render(
      <ContinueShoppingCarousel isLoading newToday={makeVehicles(3, "new")} recentlyViewed={[]} />
    );

    expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
    // The CS group renders skeletons, not gradient images for the recently-viewed slot
    expect(screen.getByLabelText("Continue shopping and new listings")).toBeInTheDocument();
  });
});

// ─── QA: Empty states ───────────────────────────────────────────────────────

describe("ContinueShoppingCarousel — empty states", () => {
  it("renders null when both groups are empty", () => {
    const { container } = render(<ContinueShoppingCarousel newToday={[]} recentlyViewed={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders New Today only when recentlyViewed is empty but newToday has items", () => {
    render(<ContinueShoppingCarousel newToday={makeVehicles(3, "new")} recentlyViewed={[]} />);
    expect(screen.getByLabelText("New listings")).toBeInTheDocument();
    expect(screen.queryByText("CONTINUE SHOPPING")).not.toBeInTheDocument();
  });
});

// ─── QA: Breakpoints — New Today always visible ─────────────────────────────

describe("ContinueShoppingCarousel — New Today always visible (no responsive hiding)", () => {
  it("N=1-2: New Today group is rendered in desktop track without responsive hide classes", () => {
    const recent = makeVehicles(2, "recent");
    const { container } = render(
      <ContinueShoppingCarousel newToday={makeVehicles(3, "new")} recentlyViewed={recent} />
    );

    const newTodayGroup = container.querySelector('[data-testid="new-today-group"]');
    expect(newTodayGroup).toBeInTheDocument();
    // No responsive hiding classes — always visible
    expect(newTodayGroup).not.toHaveClass("hidden");
  });

  it("N=3-4: New Today group is rendered in desktop track without responsive hide classes", () => {
    const recent = makeVehicles(4, "recent");
    const { container } = render(
      <ContinueShoppingCarousel newToday={makeVehicles(3, "new")} recentlyViewed={recent} />
    );

    const newTodayGroup = container.querySelector('[data-testid="new-today-group"]');
    expect(newTodayGroup).toBeInTheDocument();
    expect(newTodayGroup).not.toHaveClass("hidden");
  });

  it("N>=5: New Today group is STILL rendered (old hide rule removed)", () => {
    const recent = makeVehicles(5, "recent");
    const { container } = render(
      <ContinueShoppingCarousel newToday={makeVehicles(3, "new")} recentlyViewed={recent} />
    );

    const newTodayGroup = container.querySelector('[data-testid="new-today-group"]');
    expect(newTodayGroup).toBeInTheDocument();
  });

  it("Mobile stacked: New Today renders as separate section below CS", () => {
    const recent = makeVehicles(5, "recent");
    const { container } = render(
      <ContinueShoppingCarousel newToday={makeVehicles(3, "new")} recentlyViewed={recent} />
    );

    const mobileNewToday = container.querySelector('[data-testid="new-today-group-mobile"]');
    expect(mobileNewToday).toBeInTheDocument();
  });
});

// ─── QA: Sticky headers ─────────────────────────────────────────────────────

describe("ContinueShoppingCarousel — stickyHeader", () => {
  it("renders with stickyHeader={true} and both group labels present", () => {
    const recent = makeVehicles(2, "recent");
    render(
      <ContinueShoppingCarousel
        newToday={makeVehicles(3, "new")}
        recentlyViewed={recent}
        stickyHeader
      />
    );

    expect(screen.getAllByText("CONTINUE SHOPPING").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("NEW TODAY").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── QA: Accessibility — alt text ───────────────────────────────────────────

describe("ContinueShoppingCarousel — accessibility (alt text)", () => {
  it("each GradientImage receives alt text matching year/make/model/trim", () => {
    const vehicles = [
      makeVehicle({ id: "v-1", year: 2024, make: "Toyota", model: "Camry", trim: "SE" }),
      makeVehicle({ id: "v-2", year: 2023, make: "Toyota", model: "RAV4", trim: "XLE" }),
    ];
    const { container } = render(
      <ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />
    );

    // Desktop track renders capped at 2 items, mobile renders all 2 items
    // Both layouts render the same vehicles — 2 mobile + 2 desktop = 4 images total
    const images = container.querySelectorAll('[data-testid="gradient-img"]');
    expect(images).toHaveLength(4);
    // Check that the expected alt texts exist somewhere
    expect(screen.getAllByAltText("2024 Toyota Camry SE")).toHaveLength(2);
    expect(screen.getAllByAltText("2023 Toyota RAV4 XLE")).toHaveLength(2);
  });

  it("alt text omits trim when trim is not provided", () => {
    const vehicles = [
      makeVehicle({ id: "v-1", year: 2024, make: "Toyota", model: "Supra", trim: undefined }),
    ];
    render(<ContinueShoppingCarousel newToday={[]} recentlyViewed={vehicles} />);

    // Both mobile and desktop render the same vehicle — 1 + 1 = 2 images
    expect(screen.getAllByAltText("2024 Toyota Supra")).toHaveLength(2);
  });
});
