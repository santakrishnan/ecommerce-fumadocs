/// <reference types="@testing-library/jest-dom/vitest" />
import { Eyebrow } from "@ucmp/ui";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

// Minimal SVG stub to test icon child rendering
function MockIcon() {
  return <svg data-testid="mock-icon" />;
}

describe("Eyebrow", () => {
  describe("data-slot", () => {
    it('renders with data-slot="eyebrow"', () => {
      const { container } = render(<Eyebrow>Label text</Eyebrow>);
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el).toBeInTheDocument();
    });
  });

  describe("element", () => {
    it("renders as a <p> element", () => {
      render(<Eyebrow>Label text</Eyebrow>);
      const el = screen.getByText("Label text");
      expect(el.tagName).toBe("P");
    });
  });

  describe("typography tokens", () => {
    it("applies body-sm typography variant", () => {
      const { container } = render(<Eyebrow>Label</Eyebrow>);
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el).toHaveClass("body-sm");
      expect(el).toHaveClass("lg:body-md");
    });

    it("applies text-text-primary for surface-aware color", () => {
      const { container } = render(<Eyebrow>Label</Eyebrow>);
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el).toHaveClass("text-text-primary");
    });
  });

  describe("layout classes", () => {
    it("applies inline-flex items-center gap-0.5 base layout", () => {
      const { container } = render(<Eyebrow>Label</Eyebrow>);
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el).toHaveClass("inline-flex");
      expect(el).toHaveClass("items-center");
      expect(el).toHaveClass("gap-0.5");
    });
  });

  describe("icon child", () => {
    it("renders an svg child", () => {
      const { container } = render(
        <Eyebrow>
          <MockIcon />
          Label text
        </Eyebrow>
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("applies icon sizing idiom [&>svg]:size-3.5 on the container", () => {
      const { container } = render(
        <Eyebrow>
          <MockIcon />
          Label text
        </Eyebrow>
      );
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el?.className).toContain("[&>svg]:size-3.5");
    });

    it("applies [&>svg]:shrink-0 on the container", () => {
      const { container } = render(
        <Eyebrow>
          <MockIcon />
          Label text
        </Eyebrow>
      );
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el?.className).toContain("[&>svg]:shrink-0");
    });

    it("applies [&>svg]:pointer-events-none on the container", () => {
      const { container } = render(
        <Eyebrow>
          <MockIcon />
          Label text
        </Eyebrow>
      );
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el?.className).toContain("[&>svg]:pointer-events-none");
    });
  });

  describe("className passthrough", () => {
    it("merges contextual className onto the element", () => {
      const { container } = render(<Eyebrow className="mt-2">Label</Eyebrow>);
      const el = container.querySelector('[data-slot="eyebrow"]');
      expect(el).toHaveClass("mt-2");
    });
  });
});
