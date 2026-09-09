/// <reference types="@testing-library/jest-dom/vitest" />
import { DialogBody } from "@ucmp/ui";
import { render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("DialogBody", () => {
  describe("data-slot", () => {
    it('renders with data-slot="dialog-body"', () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).toBeInTheDocument();
    });
  });

  describe("element", () => {
    it("renders as a <div> element", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el?.tagName).toBe("DIV");
    });
  });

  describe("base classes", () => {
    it("applies min-h-0 for flex shrink-below-content behavior", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).toHaveClass("min-h-0");
    });

    it("applies flex-1 to claim remaining space", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).toHaveClass("flex-1");
    });

    it("applies overflow-y-auto for vertical scrolling", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).toHaveClass("overflow-y-auto");
    });

    it("applies scrollbar-hiding utilities for cross-browser support", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el?.className).toContain("[scrollbar-width:none]");
      expect(el?.className).toContain("[-ms-overflow-style:none]");
      expect(el?.className).toContain("[&::-webkit-scrollbar]:hidden");
    });
  });

  describe("className passthrough", () => {
    it("merges custom className onto the element", () => {
      const { container } = render(
        <DialogBody className="p-4">Content</DialogBody>
      );
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).toHaveClass("p-4");
      expect(el).toHaveClass("min-h-0");
    });
  });

  describe("children", () => {
    it("renders children content", () => {
      const { container } = render(
        <DialogBody>
          <p>Body content</p>
        </DialogBody>
      );
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el?.textContent).toBe("Body content");
    });
  });

  describe("layout", () => {
    it("does NOT apply flex or flex-col (plain block element)", () => {
      const { container } = render(<DialogBody>Content</DialogBody>);
      const el = container.querySelector('[data-slot="dialog-body"]');
      expect(el).not.toHaveClass("flex-col");
      // flex-1 is present but that's shorthand for flex: 1 1 0%, not display: flex
      expect(el?.className).not.toMatch(/(?<!\w)flex(?!-)/);
    });
  });
});
