/// <reference types="@testing-library/jest-dom" />

import { renderHook, waitFor } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsReturningUser } from "../hooks/use-is-returning-user";

// ─── Setup/Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  // Clear document.cookie and sessionStorage before each test
  for (const cookie of document.cookie.split(";")) {
    const cookieName = cookie.split("=")[0]?.trim();
    if (cookieName) {
      // biome-ignore lint/suspicious/noDocumentCookie: test setup requires direct cookie manipulation
      document.cookie = `${cookieName}=; max-age=0`;
    }
  }
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useIsReturningUser — personalized cookie and entry route detection", () => {
  it("returns true when personalized cookie is 'true'", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test setup requires direct cookie manipulation
    document.cookie = "vercel-flag-override-vdp-personalized=true";
    sessionStorage.setItem("search_entry_route", "/welcome-back");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns false when personalized cookie is 'false'", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test setup requires direct cookie manipulation
    document.cookie = "vercel-flag-override-vdp-personalized=false";
    sessionStorage.setItem("search_entry_route", "/");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns true when entry route is '/welcome-back' even if personalized is false", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test setup requires direct cookie manipulation
    document.cookie = "vercel-flag-override-vdp-personalized=false";
    sessionStorage.setItem("search_entry_route", "/welcome-back");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns true when entry route is '/welcome-back' and no personalized cookie", async () => {
    sessionStorage.setItem("search_entry_route", "/welcome-back");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("returns false when both personalized is false and entry route is not '/welcome'", async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: test setup requires direct cookie manipulation
    document.cookie = "vercel-flag-override-vdp-personalized=false";
    sessionStorage.setItem("search_entry_route", "/");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false when no personalized cookie and entry route is '/'", async () => {
    sessionStorage.setItem("search_entry_route", "/");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false when both flags are missing (new user default)", async () => {
    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("returns false and does not throw when sessionStorage is unavailable (private browsing)", async () => {
    const originalGetItem = sessionStorage.getItem;
    vi.spyOn(sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("sessionStorage not available");
    });

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    sessionStorage.getItem = originalGetItem;
  });

  it("prioritizes DEV_USER_TYPE_FLAG over entry route", async () => {
    sessionStorage.setItem("DEV_USER_TYPE_FLAG", "returning");
    sessionStorage.setItem("search_entry_route", "/");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("falls back to DEV_USER_TYPE_FLAG when no personalized cookie", async () => {
    sessionStorage.setItem("DEV_USER_TYPE_FLAG", "returning");

    const { result } = renderHook(() => useIsReturningUser());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
