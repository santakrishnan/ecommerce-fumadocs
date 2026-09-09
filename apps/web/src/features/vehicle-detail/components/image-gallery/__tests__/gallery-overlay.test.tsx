/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { EXTERIOR_IMAGES_FIXTURE } from "../../../__fixtures__/image-gallery.fixture";
import { GalleryOverlay } from "../gallery-overlay";

// Mock motion/react so overlay animations resolve immediately (no real transitions in jsdom).
// Fires `onAnimationComplete` on every render so expand/collapse phase transitions settle
// synchronously — this lets tests exercise repeated open/close cycles without fake timers.
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      onAnimationComplete,
      ...props
    }: Record<string, unknown> & { onAnimationComplete?: () => void }) => {
      useEffect(() => {
        onAnimationComplete?.();
      });
      return <div {...props}>{children as ReactNode}</div>;
    },
  },
}));

const TRIGGER_PROPS = {
  coverImageAlt: "Gallery cover",
  coverImageUrl: "/images/vdp/gallery/cover.png",
};

describe("GalleryOverlay", () => {
  it("renders the trigger without a navigational link", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the trigger as a plain button, avoiding invalid nested interactive elements", () => {
    const { container } = render(
      <GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />
    );
    // No <button> should contain another <a> or <button> descendant.
    const buttons = container.querySelectorAll("button");
    for (const button of Array.from(buttons)) {
      expect(button.querySelector("a")).toBeNull();
    }
  });

  it("opens the overlay when the whole-card trigger is activated by click", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);
    expect(screen.queryByRole("dialog", { name: "Image gallery" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));

    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();
  });

  it("opens the overlay when the corner action button is activated by click", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);

    const actionButton = screen.getByRole("button", { name: "View more Image Gallery" });
    actionButton.focus();
    fireEvent.click(actionButton);

    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();
  });

  it("supports repeated open/close cycles without getting stuck", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);

    for (let cycle = 0; cycle < 3; cycle++) {
      fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));
      expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Close gallery" }));
      expect(screen.queryByRole("dialog", { name: "Image gallery" })).not.toBeInTheDocument();
    }
  });

  it("renders only the trigger (no clickable action, no dialog) when there are no images", () => {
    render(<GalleryOverlay images={[]} {...TRIGGER_PROPS} />);
    expect(screen.getByText("Image Gallery")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Image Gallery" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render a clickable trigger when there are no images (open is gated on hasImages)", () => {
    render(<GalleryOverlay images={[]} {...TRIGGER_PROPS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets to the closed state when the browser Back button is pressed while Gallery is open (real repro: click Back, then reopen the same VIN)", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));
    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();

    // The reported repro navigates via Next.js App Router client-side routing
    // (search-card click / browser Back), which never fires `pageshow` since
    // there is no full-document reload. `popstate` fires natively on every
    // back/forward navigation and is the real signal this app relies on —
    // without this reset, the same (Router-Cache-reused) component instance
    // would still report Gallery as open when the same VIN is reopened.
    fireEvent(window, new Event("popstate"));

    expect(screen.queryByRole("dialog", { name: "Image gallery" })).not.toBeInTheDocument();

    // Reopening the same VIN card (same component instance, never unmounted)
    // must show the normal VDP, not resume directly into Gallery.
    fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));
    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();
  });

  it("resets to the closed state when the page is restored from bfcache while Gallery is open (defensive fallback path)", () => {
    render(<GalleryOverlay images={EXTERIOR_IMAGES_FIXTURE} {...TRIGGER_PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));
    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();

    // Simulate the browser restoring this VDP document from bfcache after the
    // user pressed Back from the open Gallery and then reopened the same VIN —
    // without this reset, the overlay would still report itself as open.
    const pageShowEvent = new Event("pageshow") as PageTransitionEvent;
    Object.defineProperty(pageShowEvent, "persisted", { value: true, configurable: true });
    fireEvent(window, pageShowEvent);

    expect(screen.queryByRole("dialog", { name: "Image gallery" })).not.toBeInTheDocument();

    // The trigger can still be re-activated normally afterward.
    fireEvent.click(screen.getByRole("button", { name: "Image Gallery" }));
    expect(screen.getByRole("dialog", { name: "Image gallery" })).toBeInTheDocument();
  });
});
