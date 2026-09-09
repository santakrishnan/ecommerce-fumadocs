/// <reference types="@testing-library/jest-dom/vitest" />
import "@testing-library/jest-dom/vitest";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@ucmp/ui";
import { render } from "@ucmp/vitest-config/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Force `useMediaQuery("(min-width: 1440px)")` to report a specific viewport by
 * controlling `window.matchMedia`. The package-level vitest setup already
 * stubs matchMedia to `matches: false`; here we override per-test to simulate
 * desktop (lg+) vs. mobile/tablet.
 */
function mockViewport(isDesktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isDesktop,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderContent(props: { fullScreen?: boolean } = {}) {
  return render(
    <Dialog open>
      <DialogContent {...props}>
        <DialogTitle>Title</DialogTitle>
        <p>Body content</p>
      </DialogContent>
    </Dialog>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DialogContent", () => {
  describe("renders children exactly once (no duplication)", () => {
    it("renders a single inner wrapper on desktop, non-full-screen", () => {
      mockViewport(true);
      renderContent();
      const inners = document.querySelectorAll(
        '[data-slot="dialog-content-inner"]'
      );
      expect(inners).toHaveLength(1);
      expect(document.querySelectorAll('[data-slot="dialog-title"]')).toHaveLength(
        1
      );
    });

    it("renders a single inner wrapper on mobile/tablet", () => {
      mockViewport(false);
      renderContent();
      const inners = document.querySelectorAll(
        '[data-slot="dialog-content-inner"]'
      );
      expect(inners).toHaveLength(1);
      expect(document.querySelectorAll('[data-slot="dialog-title"]')).toHaveLength(
        1
      );
    });
  });

  describe("inner wrapper selection", () => {
    // The desktop centered modal (lg+, non-full-screen) uses a plain flex
    // column (px-10). Every other case uses a centered, max-width-constrained
    // wrapper (mx-auto + max-w-(--container-xl)).
    function getInner() {
      return document.querySelector('[data-slot="dialog-content-inner"]');
    }

    it("uses the centered wrapper on mobile/tablet (non-full-screen)", () => {
      mockViewport(false);
      renderContent();
      expect(getInner()).toHaveClass("mx-auto");
    });

    it("uses the centered wrapper on mobile/tablet when full-screen", () => {
      mockViewport(false);
      renderContent({ fullScreen: true });
      expect(getInner()).toHaveClass("mx-auto");
    });

    it("uses the centered wrapper on desktop when full-screen", () => {
      mockViewport(true);
      renderContent({ fullScreen: true });
      expect(getInner()).toHaveClass("mx-auto");
    });

    it("uses the plain flex wrapper on desktop when non-full-screen", () => {
      mockViewport(true);
      renderContent();
      const inner = getInner();
      expect(inner).not.toHaveClass("mx-auto");
      expect(inner).toHaveClass("px-10");
    });
  });
});
