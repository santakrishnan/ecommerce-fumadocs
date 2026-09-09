/// <reference types="@testing-library/jest-dom/vitest" />
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  useParams() {
    return {};
  },
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: (props: any) => props,
}));

// Everything below touches `window`/DOM globals, which only exist under the
// jsdom environment. Pure-node test files (`// @vitest-environment node`)
// still load this shared setup file, so guard on `window`'s presence rather
// than assuming it — this keeps jsdom behavior byte-identical while letting
// node-environment files skip DOM mocking that would otherwise throw
// `ReferenceError: window is not defined`.
if (typeof window !== "undefined") {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;

  // Mock ResizeObserver (required by embla-carousel and similar libraries)
  global.ResizeObserver = class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;

  // ─── jsdom "Not implemented" warning fixes ────────────────────────────────

  // Mock window.location navigation methods — jsdom cannot navigate to another
  // document and emits "Not implemented: navigation" when code calls
  // window.location.replace(), window.location.reload(), or sets window.location.href.
  // This is a real mock (not suppression) — it prevents the warning at the source
  // by replacing the unimplemented APIs with no-op spies. Tests that need to assert
  // on these calls can override via Object.defineProperty as search-exit-guard.test.tsx does.
  const baseOrigin = window.location.origin;

  let mockHref = window.location.href;

  const locationMock = {
    replace: vi.fn(),
    reload: vi.fn(),
    assign: vi.fn(),
    get href() {
      return mockHref;
    },
    set href(nextHref: string) {
      mockHref = nextHref;
    },
    get origin() {
      return new URL(mockHref, baseOrigin).origin;
    },
    get pathname() {
      return new URL(mockHref, baseOrigin).pathname;
    },
    get search() {
      return new URL(mockHref, baseOrigin).search;
    },
    get hash() {
      return new URL(mockHref, baseOrigin).hash;
    },
  } as any;

  Object.defineProperty(window, "location", {
    value: locationMock,
    writable: true,
    configurable: true,
  });

  // Mock window.scrollTo — jsdom does not implement it and emits a warning.
  window.scrollTo = vi.fn() as any;
}
