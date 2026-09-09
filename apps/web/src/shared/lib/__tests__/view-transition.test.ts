import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startViewTransitionIfAvailable } from "../view-transition";

describe("startViewTransitionIfAvailable", () => {
  let mockCallback: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    mockCallback = vi.fn<() => void>();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should execute callback immediately when document is undefined", () => {
    const originalDocument = globalThis.document;
    // biome-ignore lint/performance/noDelete: Testing edge case
    delete (globalThis as any).document;

    startViewTransitionIfAvailable(mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    globalThis.document = originalDocument;
  });

  it("should execute callback immediately when startViewTransition is not available", () => {
    const originalDocument = globalThis.document;
    globalThis.document = {} as any;

    startViewTransitionIfAvailable(mockCallback);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    globalThis.document = originalDocument;
  });

  it("should call document.startViewTransition when available", () => {
    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });

    const originalDocument = globalThis.document;
    globalThis.document = {
      startViewTransition: mockStartViewTransition,
    } as any;

    startViewTransitionIfAvailable(mockCallback);

    expect(mockStartViewTransition).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    globalThis.document = originalDocument;
  });

  it("should pass callback to startViewTransition", () => {
    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });

    const originalDocument = globalThis.document;
    globalThis.document = {
      startViewTransition: mockStartViewTransition,
    } as any;

    startViewTransitionIfAvailable(mockCallback);

    // Verify the callback was passed to startViewTransition
    const passedCallback = mockStartViewTransition.mock.calls[0]?.[0];
    expect(typeof passedCallback).toBe("function");

    globalThis.document = originalDocument;
  });

  it("should handle callback that throws error gracefully", () => {
    const errorCallback = vi.fn(() => {
      throw new Error("Test error");
    });

    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });

    const originalDocument = globalThis.document;
    globalThis.document = {
      startViewTransition: mockStartViewTransition,
    } as any;

    expect(() => {
      startViewTransitionIfAvailable(errorCallback);
    }).toThrow("Test error");

    globalThis.document = originalDocument;
  });

  it("should execute callback synchronously", () => {
    const executionOrder: string[] = [];

    const testCallback = () => {
      executionOrder.push("callback");
    };

    executionOrder.push("before");
    startViewTransitionIfAvailable(testCallback);
    executionOrder.push("after");

    expect(executionOrder).toEqual(["before", "callback", "after"]);
  });

  it("should handle multiple sequential calls", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    startViewTransitionIfAvailable(callback1);
    startViewTransitionIfAvailable(callback2);
    startViewTransitionIfAvailable(callback3);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it("should work with router.push-like callbacks", () => {
    const mockRouter = {
      push: vi.fn(),
    };

    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });

    const originalDocument = globalThis.document;
    globalThis.document = {
      startViewTransition: mockStartViewTransition,
    } as any;

    startViewTransitionIfAvailable(() => {
      mockRouter.push("/new-route");
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/new-route");

    globalThis.document = originalDocument;
  });

  it("should work with flushSync-wrapped callbacks", () => {
    const updateCallback = vi.fn();
    const mockFlushSync = vi.fn((cb: () => void) => {
      cb();
    });

    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });

    const originalDocument = globalThis.document;
    globalThis.document = {
      startViewTransition: mockStartViewTransition,
    } as any;

    startViewTransitionIfAvailable(() => {
      mockFlushSync(updateCallback);
    });

    expect(mockFlushSync).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenCalledTimes(1);

    globalThis.document = originalDocument;
  });
});
