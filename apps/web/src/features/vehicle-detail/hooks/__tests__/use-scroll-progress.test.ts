import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollProgress } from "../use-scroll-progress";

describe("useScrollProgress", () => {
  let scrollY: number;
  let innerWidth: number;
  let matchMediaResult: { matches: boolean };

  beforeEach(() => {
    scrollY = 0;
    innerWidth = 1024;
    matchMediaResult = { matches: false };

    Object.defineProperty(window, "scrollY", { get: () => scrollY, configurable: true });
    Object.defineProperty(window, "innerWidth", { get: () => innerWidth, configurable: true });
    vi.spyOn(window, "matchMedia").mockReturnValue(matchMediaResult as MediaQueryList);
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns 0 when scroll is at the top", () => {
    scrollY = 0;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("returns 1 when scroll exceeds desktop threshold (500px)", () => {
    scrollY = 600;
    innerWidth = 1200;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(1);
  });

  it("returns 1 when scroll exceeds mobile threshold (280px)", () => {
    scrollY = 300;
    innerWidth = 375;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(1);
  });

  it("returns interpolated value between 0 and 1", () => {
    scrollY = 250;
    innerWidth = 1200;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0.5);
  });

  it("uses mobile threshold on narrow viewports", () => {
    scrollY = 140;
    innerWidth = 375;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0.5);
  });

  it("returns 1 immediately when prefers-reduced-motion is enabled", () => {
    matchMediaResult.matches = true;
    scrollY = 0;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(1);
  });

  it("registers a passive scroll listener", () => {
    renderHook(() => useScrollProgress());
    expect(window.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
  });

  it("cleans up scroll listener on unmount", () => {
    const { unmount } = renderHook(() => useScrollProgress());
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("updates progress on scroll via requestAnimationFrame", () => {
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);

    scrollY = 250;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      vi.runAllTimers();
    });

    expect(result.current).toBe(0.5);
  });

  it("clamps progress to 0 for negative scroll values", () => {
    scrollY = -10;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it("accepts custom start and end thresholds", () => {
    scrollY = 50;
    innerWidth = 1200;
    const { result } = renderHook(() =>
      useScrollProgress({ start: 0, endDesktop: 100, endMobile: 50 })
    );
    expect(result.current).toBe(0.5);
  });
});
