/// <reference types="@testing-library/jest-dom/vitest" />

import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ConversationalSearchBackdrop } from "../components/conversational-search-backdrop/conversational-search-backdrop";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, className, sizes, priority, ...rest }: Record<string, unknown>) => {
    // next/image accepts both string URLs and StaticImageData objects.
    // Normalise to a plain string so the DOM attribute is always readable.
    const srcString =
      typeof src === "object" && src !== null && "src" in src
        ? (src as { src: string }).src
        : (src as string);
    return (
      <div
        aria-label={alt as string}
        className={className as string}
        data-fill={fill ? "true" : "false"}
        data-priority={priority ? "true" : "false"}
        data-sizes={sizes as string}
        data-src={srcString}
        data-testid="background-image"
        role="img"
        {...rest}
      />
    );
  },
}));

describe("ConversationalSearchBackdrop", () => {
  describe("Rendering", () => {
    it("renders with aria-hidden", () => {
      const { container } = render(<ConversationalSearchBackdrop />);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveAttribute("aria-hidden", "true");
    });

    it("renders with pointer-events-none", () => {
      const { container } = render(<ConversationalSearchBackdrop />);
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain("pointer-events-none");
    });

    it("renders with fixed inset-0 positioning", () => {
      const { container } = render(<ConversationalSearchBackdrop />);
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain("fixed");
      expect(root.className).toContain("inset-0");
    });

    it("renders an img element", () => {
      render(<ConversationalSearchBackdrop />);
      const img = document.querySelector("[data-testid='background-image']");
      expect(img).toBeInTheDocument();
    });
  });

  describe("Fallback behavior (no imageUrl)", () => {
    it("uses the default fallback image src", () => {
      render(<ConversationalSearchBackdrop />);
      const img = document.querySelector("[data-testid='background-image']");
      expect(img?.getAttribute("data-src")).toContain("search_background_blur");
    });

    it("renders with fill attribute", () => {
      render(<ConversationalSearchBackdrop />);
      const img = document.querySelector("[data-testid='background-image']");
      expect(img).toHaveAttribute("data-fill", "true");
    });
  });

  describe("Dynamic image (imageUrl provided)", () => {
    it("uses the provided image URL", () => {
      render(<ConversationalSearchBackdrop imageUrl="/images/my-car.jpg" />);
      const img = document.querySelector("[data-testid='background-image']");
      expect(img?.getAttribute("data-src")).toContain("my-car");
    });

    it("renders with priority", () => {
      render(<ConversationalSearchBackdrop imageUrl="/images/my-car.jpg" />);
      const img = document.querySelector("[data-testid='background-image']");
      expect(img).toHaveAttribute("data-priority", "true");
    });
  });
});
