import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExpandOverlay } from "../use-expand-overlay";

describe("useExpandOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createAnchorRef(rect?: Partial<DOMRect>) {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({
      top: 100,
      left: 200,
      width: 300,
      height: 400,
      bottom: 500,
      right: 500,
      x: 200,
      y: 100,
      toJSON: () => ({}),
      ...rect,
    });

    return { current: el } as React.RefObject<HTMLElement>;
  }

  describe("initial state", () => {
    it("starts in closed phase", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      expect(result.current.phase).toBe("closed");
      expect(result.current.isMounted).toBe(false);
      expect(result.current.contentVisible).toBe(false);
    });
  });

  describe("open()", () => {
    it("transitions to expanding phase and sets isMounted to true", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());

      expect(result.current.phase).toBe("expanding");
      expect(result.current.isMounted).toBe(true);
      expect(result.current.contentVisible).toBe(false);
    });

    it("snapshots the anchor element bounding rect as sourceRect", () => {
      const ref = createAnchorRef({ top: 50, left: 75, width: 200, height: 150 });
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());

      expect(result.current.sourceRect).toEqual({
        top: 50,
        left: 75,
        width: 200,
        height: 150,
        borderRadius: 16,
      });
    });

    it("transitions to open phase after animation duration", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { animationDuration: 500 }));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => {
        vi.advanceTimersByTime(550);
      });

      expect(result.current.phase).toBe("open");
      expect(result.current.contentVisible).toBe(true);
    });

    it("does nothing if already open", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });

      expect(result.current.phase).toBe("open");

      // Calling open again should be a no-op
      act(() => result.current.open());
      expect(result.current.phase).toBe("open");
    });

    it("falls back to viewport dimensions when anchor ref is null", () => {
      const ref = { current: null } as React.RefObject<HTMLElement | null>;

      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());

      expect(result.current.sourceRect.borderRadius).toBe(0);
      expect(result.current.sourceRect.top).toBe(0);
      expect(result.current.sourceRect.left).toBe(0);
    });
  });

  describe("close()", () => {
    it("transitions from open → closing → collapsing", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { contentFadeDuration: 300 }));

      // Open fully
      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      // Start closing
      act(() => result.current.close());
      expect(result.current.phase).toBe("closing");
      expect(result.current.contentVisible).toBe(false);

      // After content fade duration, should transition to collapsing
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.phase).toBe("collapsing");
    });

    it("does nothing if not in open phase", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      // Still in closed state
      act(() => result.current.close());
      expect(result.current.phase).toBe("closed");
    });
  });

  describe("onCollapseEnd()", () => {
    it("transitions from collapsing to closed and calls onClosed callback", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() =>
        useExpandOverlay(ref, { onClosed, contentFadeDuration: 300 })
      );

      // Open fully
      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });

      // Close and advance through closing → collapsing
      act(() => result.current.close());
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.phase).toBe("collapsing");

      // Simulate the animation completing
      act(() => result.current.onCollapseEnd());

      expect(result.current.phase).toBe("closed");
      expect(result.current.isMounted).toBe(false);
      expect(onClosed).toHaveBeenCalledOnce();
    });

    it("does nothing if not in collapsing phase", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.onCollapseEnd());

      expect(result.current.phase).toBe("closed");
      expect(onClosed).not.toHaveBeenCalled();
    });
  });

  describe("full lifecycle", () => {
    it("supports open → close → reopen", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { contentFadeDuration: 300 }));

      // First open
      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      // Close
      act(() => result.current.close());
      act(() => {
        vi.advanceTimersByTime(300);
      });
      act(() => result.current.onCollapseEnd());
      expect(result.current.phase).toBe("closed");

      // Reopen
      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");
    });

    it("allows closing during expanding (Escape mid-animation)", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      // Close while still expanding — should skip fade-out and go straight to collapsing
      act(() => result.current.close());
      expect(result.current.phase).toBe("collapsing");

      // The open() timer should NOT fire and flip phase back to "open"
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.phase).toBe("collapsing");

      // Simulate collapse animation completing
      act(() => result.current.onCollapseEnd());
      expect(result.current.phase).toBe("closed");
      expect(onClosed).toHaveBeenCalledOnce();
    });
  });

  describe("teardown reset (primary defense — covers Router Cache deactivation, not just full unmount)", () => {
    it("calls onClosed when the hook instance is torn down while the overlay is open", () => {
      // Models Next.js App Router deactivating this component instance (e.g.
      // keeping it alive-but-hidden across a Back navigation, or a genuine
      // unmount) rather than a `popstate`/`pageshow` event ever firing. React
      // guarantees this teardown runs regardless of *why* the instance is
      // being torn down, so it must not depend on any DOM navigation event.
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result, unmount } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      act(() => unmount());

      expect(onClosed).toHaveBeenCalledOnce();
    });

    it("does not call onClosed on teardown when the overlay was already closed", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { unmount } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => unmount());

      expect(onClosed).not.toHaveBeenCalled();
    });

    it("calls onClosed on teardown even mid-expand animation, before the open() timer fires", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result, unmount } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => unmount());

      expect(onClosed).toHaveBeenCalledOnce();
    });
  });

  describe("browser history navigation reset (popstate — primary path for client-side back/forward)", () => {
    function firePopstate() {
      window.dispatchEvent(new Event("popstate"));
    }

    it("force-resets to closed when a back/forward navigation occurs while open", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      // Simulate the browser Back button — Next.js App Router handles this
      // as a client-side navigation (no full document reload), so `popstate`
      // is the only reliable signal that the user left the page.
      act(() => firePopstate());

      expect(result.current.phase).toBe("closed");
      expect(result.current.isMounted).toBe(false);
    });

    it("calls onClosed when force-resetting on popstate", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });

      act(() => firePopstate());

      expect(onClosed).toHaveBeenCalledOnce();
    });

    it("force-resets even mid-expand or mid-collapse animation", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => firePopstate());

      expect(result.current.phase).toBe("closed");
    });

    it("does nothing on popstate when the overlay is already closed", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      expect(result.current.phase).toBe("closed");

      act(() => firePopstate());

      expect(result.current.phase).toBe("closed");
      expect(onClosed).not.toHaveBeenCalled();
    });

    it("cancels the pending open→open timer so it cannot fire after the popstate reset", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => firePopstate());
      expect(result.current.phase).toBe("closed");

      // The original open() timer (animationDuration + 50) would have flipped
      // phase to "open" — it must not fire after the forced reset.
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.phase).toBe("closed");
    });

    it("stays reset through a subsequent same-VIN reopen (Router-Cache component reuse simulation)", () => {
      // Simulates Next.js App Router client Router Cache reusing the same
      // component instance across Back + reopening the same VIN's card —
      // the exact repro reported for F-4: open, leave via Back (popstate),
      // then immediately reopen without ever unmounting the hook.
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      act(() => firePopstate());
      expect(result.current.phase).toBe("closed");

      // Reopening the same VIN card calls open() again on the very same
      // (never-unmounted) hook instance — must behave like a normal fresh open.
      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");
    });
  });

  describe("bfcache restore (pageshow — defensive fallback for full-document restores)", () => {
    function firePageShow(persisted: boolean) {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: persisted, configurable: true });
      window.dispatchEvent(event);
    }

    it("force-resets to closed when the page is restored from bfcache while open", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      // Simulate browser-back restoring this document from bfcache while the
      // overlay was left open — the repro reported for repeated same-VIN reopen.
      act(() => firePageShow(true));

      expect(result.current.phase).toBe("closed");
      expect(result.current.isMounted).toBe(false);
    });

    it("calls onClosed when force-resetting from bfcache restore", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });

      act(() => firePageShow(true));

      expect(onClosed).toHaveBeenCalledOnce();
    });

    it("force-resets even while mid-expand or mid-collapse animation", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => firePageShow(true));

      expect(result.current.phase).toBe("closed");
    });

    it("does nothing on pageshow when the overlay is already closed", () => {
      const onClosed = vi.fn();
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref, { onClosed }));

      expect(result.current.phase).toBe("closed");

      act(() => firePageShow(true));

      expect(result.current.phase).toBe("closed");
      expect(onClosed).not.toHaveBeenCalled();
    });

    it("does nothing on a non-persisted pageshow (normal load, not a bfcache restore)", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");

      act(() => firePageShow(false));

      expect(result.current.phase).toBe("open");
    });

    it("cancels the pending open→open timer so it cannot fire after the bfcache reset", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");

      act(() => firePageShow(true));
      expect(result.current.phase).toBe("closed");

      // The original open() timer (animationDuration + 50) would have flipped
      // phase to "open" — it must not fire after the forced reset.
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.phase).toBe("closed");
    });

    it("allows a normal reopen after a bfcache-triggered reset", () => {
      const ref = createAnchorRef();
      const { result } = renderHook(() => useExpandOverlay(ref));

      act(() => result.current.open());
      act(() => {
        vi.advanceTimersByTime(550);
      });
      act(() => firePageShow(true));
      expect(result.current.phase).toBe("closed");

      act(() => result.current.open());
      expect(result.current.phase).toBe("expanding");
      act(() => {
        vi.advanceTimersByTime(550);
      });
      expect(result.current.phase).toBe("open");
    });
  });
});
