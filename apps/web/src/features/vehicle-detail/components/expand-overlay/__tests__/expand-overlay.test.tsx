/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpandOverlayProps } from "../expand-overlay";
import { ExpandOverlay } from "../expand-overlay";

// Mock motion/react to render immediately without animation
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      transition: _transition,
      onAnimationComplete,
      ...props
    }: Record<string, unknown>) => {
      const handler = onAnimationComplete as (() => void) | undefined;
      return (
        <div {...props}>
          {children as React.ReactNode}
          {handler ? (
            <button
              data-testid="trigger-animation-complete"
              onClick={() => handler()}
              type="button"
            />
          ) : null}
        </div>
      );
    },
  },
}));

const DEFAULT_SOURCE_RECT = {
  top: 100,
  left: 200,
  width: 300,
  height: 400,
  borderRadius: 16,
};

function renderOverlay(overrides: Partial<ExpandOverlayProps> = {}) {
  const defaultProps: ExpandOverlayProps = {
    ariaLabel: "Test overlay",
    children: <button type="button">Close</button>,
    contentVisible: true,
    onCollapseEnd: vi.fn(),
    onRequestClose: vi.fn(),
    phase: "open",
    sourceRect: DEFAULT_SOURCE_RECT,
    ...overrides,
  };

  return { ...render(<ExpandOverlay {...defaultProps} />), props: defaultProps };
}

describe("ExpandOverlay", () => {
  beforeEach(() => {
    // Reset body state
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  describe("Escape key handling", () => {
    it("calls onRequestClose when Escape is pressed", () => {
      const onRequestClose = vi.fn();
      renderOverlay({ onRequestClose });

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onRequestClose).toHaveBeenCalledOnce();
    });

    it("does not call onRequestClose for other keys", () => {
      const onRequestClose = vi.fn();
      renderOverlay({ onRequestClose });

      fireEvent.keyDown(document, { key: "Enter" });

      expect(onRequestClose).not.toHaveBeenCalled();
    });
  });

  describe("Body scroll locking", () => {
    it("sets body overflow to hidden on mount", () => {
      renderOverlay();

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("restores body overflow on unmount", () => {
      document.body.style.overflow = "auto";
      const { unmount } = renderOverlay();

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).toBe("auto");
    });
  });

  describe("Inert management", () => {
    it("sets the root element inert on mount", () => {
      const root = document.createElement("div");
      root.id = "__next";
      document.body.appendChild(root);

      renderOverlay();

      expect(root.inert).toBe(true);

      document.body.removeChild(root);
    });

    it("removes inert on unmount", () => {
      const root = document.createElement("div");
      root.id = "__next";
      document.body.appendChild(root);

      const { unmount } = renderOverlay();
      expect(root.inert).toBe(true);

      unmount();
      expect(root.inert).toBe(false);

      document.body.removeChild(root);
    });
  });

  describe("Focus restoration", () => {
    it("restores focus to the previously focused element on unmount", () => {
      const trigger = document.createElement("button");
      trigger.textContent = "Open";
      document.body.appendChild(trigger);
      trigger.focus();

      expect(document.activeElement).toBe(trigger);

      const { unmount } = renderOverlay();
      unmount();

      expect(document.activeElement).toBe(trigger);

      document.body.removeChild(trigger);
    });
  });

  describe("Portal rendering", () => {
    it("renders a dialog with the correct aria attributes", () => {
      renderOverlay({ ariaLabel: "Vehicle gallery" });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-label", "Vehicle gallery");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("Collapse callback", () => {
    it("calls onCollapseEnd when animation completes during collapsing phase", () => {
      const onCollapseEnd = vi.fn();
      renderOverlay({ phase: "collapsing", onCollapseEnd });

      // Trigger the mocked animation complete
      fireEvent.click(screen.getByTestId("trigger-animation-complete"));

      expect(onCollapseEnd).toHaveBeenCalledOnce();
    });

    it("does not call onCollapseEnd when animation completes during expanding phase", () => {
      const onCollapseEnd = vi.fn();
      renderOverlay({ phase: "expanding", onCollapseEnd });

      fireEvent.click(screen.getByTestId("trigger-animation-complete"));

      expect(onCollapseEnd).not.toHaveBeenCalled();
    });
  });
});
