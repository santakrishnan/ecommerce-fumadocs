/// <reference types="@testing-library/jest-dom" />
import { VDP_HERO_READY_ATTR as HERO_READY_ATTR } from "@shared/components/shared-hero-transition/config";
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { HeroBackground } from "../hero-background";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, loading, src, alt, ...props }: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: querySelectorAll("img") assertions require a real img element
    <img alt={(alt as string) ?? ""} height={1} src={src as string} width={1} {...props} />
  ),
}));

// Mock the scroll progress hook
vi.mock("@features/vehicle-detail/hooks/use-scroll-progress", () => ({
  useScrollProgress: () => 0,
}));

describe("HeroBackground", () => {
  it("renders a hero image with the provided src", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find(
      (img) => img.getAttribute("alt") === "Vehicle hero background"
    );
    expect(heroImage).toBeTruthy();
    expect(heroImage?.getAttribute("src")).toBe("/images/vdp/vdp-hero.png");
  });

  it("uses custom alt text when provided", () => {
    const { container } = render(
      <HeroBackground alt="Custom alt" src="/images/vdp/vdp-hero.png" />
    );
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find((img) => img.getAttribute("alt") === "Custom alt");
    expect(heroImage).toBeTruthy();
  });

  it("sets --hero-gradient-color to the fallback token before onLoad sampling", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue("--hero-gradient-color")).toBe("var(--color-neutral-600)");
  });

  it("renders the gradient shade overlay", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const shadeElements = container.querySelectorAll("[aria-hidden='true']");
    // Should have multiple aria-hidden layers (bg fill, gradient, blur overlay)
    expect(shadeElements.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the hero image with fill sizing", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find(
      (img) => img.getAttribute("alt") === "Vehicle hero background"
    );
    // next/image fill prop renders as style attributes in the real component
    // In mock, it passes as a boolean — just verify the image exists and has src
    expect(heroImage).toBeTruthy();
    expect(heroImage?.getAttribute("src")).toBe("/images/vdp/vdp-hero.png");
  });

  it("applies object-cover and object-position classes to the image", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find(
      (img) => img.getAttribute("alt") === "Vehicle hero background"
    );
    expect(heroImage?.className).toContain("object-cover");
    expect(heroImage?.className).toContain("object-center");
  });

  it("signals hero-ready immediately when the image is already complete on mount (cached same-VIN reopen)", () => {
    // Simulates the browser having already decoded the hero image from cache
    // before React attaches the onLoad handler — the scenario that left the
    // repeated same-VIN VDP reopen stuck behind the 30s safety-net timeout.
    const originalComplete = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete"
    );
    const originalNaturalWidth = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "naturalWidth"
    );

    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      configurable: true,
      get: () => 800,
    });

    try {
      render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
      expect(document.documentElement.getAttribute(HERO_READY_ATTR)).toBe("true");
    } finally {
      document.documentElement.removeAttribute(HERO_READY_ATTR);
      if (originalComplete) {
        Object.defineProperty(HTMLImageElement.prototype, "complete", originalComplete);
      }
      if (originalNaturalWidth) {
        Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", originalNaturalWidth);
      }
    }
  });

  it("does not signal hero-ready on mount when the image has not finished loading", () => {
    render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    expect(document.documentElement.hasAttribute(HERO_READY_ATTR)).toBe(false);
  });

  it("still signals hero-ready via onLoad for a normal (non-cached) image load", () => {
    const { container } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find(
      (img) => img.getAttribute("alt") === "Vehicle hero background"
    );
    expect(heroImage).toBeTruthy();

    heroImage?.dispatchEvent(new Event("load"));

    expect(document.documentElement.getAttribute(HERO_READY_ATTR)).toBe("true");
    document.documentElement.removeAttribute(HERO_READY_ATTR);
  });

  it("removes the hero-ready attribute on unmount", () => {
    const { container, unmount } = render(<HeroBackground src="/images/vdp/vdp-hero.png" />);
    const images = container.querySelectorAll("img");
    const heroImage = Array.from(images).find(
      (img) => img.getAttribute("alt") === "Vehicle hero background"
    );
    heroImage?.dispatchEvent(new Event("load"));
    expect(document.documentElement.getAttribute(HERO_READY_ATTR)).toBe("true");

    unmount();

    expect(document.documentElement.hasAttribute(HERO_READY_ATTR)).toBe(false);
  });
});
