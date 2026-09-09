/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { ConfirmationContent } from "../confirmation-content";

const MESSAGE = "Your phone number has been verified";

/** The content root is the element carrying `data-step-id`. */
function getRoot(container: HTMLElement): HTMLElement {
  const root = container.querySelector<HTMLElement>('[data-step-id="confirmation"]');
  if (!root) {
    throw new Error("confirmation root not found");
  }
  return root;
}

describe("ConfirmationContent", () => {
  describe("rendering", () => {
    it("renders the provided message", () => {
      render(<ConfirmationContent message={MESSAGE} />);
      expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    });

    it("renders the checkmark icon", () => {
      const { container } = render(<ConfirmationContent message={MESSAGE} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("fills its parent and centers its own stack, without owning positioning", () => {
      const { container } = render(<ConfirmationContent message={MESSAGE} />);
      const root = getRoot(container);
      // Fills the parent and centers its column — the consumer owns where/how
      // the content is positioned (no fixed/inset/z assumptions here).
      expect(root.className).toContain("size-full");
      expect(root.className).toContain("items-center");
      expect(root.className).toContain("justify-center");
      // Horizontal padding via the grid margin token so content doesn't hit the
      // screen edges on mobile.
      expect(root.className).toContain("px-(--page-grid-margin)");
      expect(root.className).not.toContain("fixed");
      expect(root.className).not.toContain("inset-0");
      // The content is presentational — it must not own a button/dismiss control.
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("uses the grey background and a light surface (black text) for the default variant", () => {
      const { container } = render(<ConfirmationContent message={MESSAGE} />);
      const root = getRoot(container);
      expect(root).toHaveAttribute("data-variant", "default");
      expect(root.className).toContain("bg-surface-secondary");

      const message = screen.getByText(MESSAGE);
      expect(message.className).toContain("text-text-primary");
      expect(message).toHaveAttribute("data-surface", "light");
    });

    it("uses the brand-red background and a dark surface (white text) for the red variant", () => {
      const { container } = render(<ConfirmationContent message={MESSAGE} variant="red" />);
      const root = getRoot(container);
      expect(root).toHaveAttribute("data-variant", "red");
      expect(root.className).toContain("bg-brand");

      const message = screen.getByText(MESSAGE);
      expect(message.className).toContain("text-text-primary");
      expect(message).toHaveAttribute("data-surface", "dark");
    });
  });
});
