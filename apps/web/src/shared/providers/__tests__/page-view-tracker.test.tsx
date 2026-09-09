/// <reference types="@testing-library/jest-dom" />
import { act, render, waitFor } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageViewTracker } from "../page-view-tracker";

// ─── Module mocks ────────────────────────────────────────────────────────────

const { mockUsePathname, mockUseVisitorIdentity, mockRecordActivityClient } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
  mockUseVisitorIdentity: vi.fn<() => { visitorId: string | null; sessionId: string | null }>(),
  mockRecordActivityClient: vi.fn<() => Promise<void>>(),
}));

// next/navigation is already mocked by the global test setup, but we need
// to control usePathname per-test so we override it here.
vi.mock("next/navigation", () => ({ usePathname: mockUsePathname }));

vi.mock("@shared/providers/visitor-provider", () => ({
  useVisitorIdentity: mockUseVisitorIdentity,
}));

// Partially mock the client entry point — swap only recordActivityClient so
// that resolvePageType uses its real implementation and pageType/referrerPageType
// assertions reflect actual route classification.
vi.mock("@features/profile/activities/client", async (importOriginal) => {
  const real = await importOriginal<typeof import("@features/profile/activities/client")>();
  return { ...real, recordActivityClient: mockRecordActivityClient };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mount and flush initial effects. Returns the RTL rerender handle. */
async function mountTracker() {
  const utils = render(<PageViewTracker />);
  // Flush initial effects.
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

/** Extract the first argument of the most recent mock call as a plain object. */
function lastPayload(): Record<string, unknown> {
  return (mockRecordActivityClient.mock.lastCall as unknown as [Record<string, unknown>])[0];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PageViewTracker", () => {
  beforeEach(() => {
    mockRecordActivityClient.mockResolvedValue(undefined);
  });

  // ─── Identity guard ───────────────────────────────────────────────────────

  describe("identity guard", () => {
    it("does not fire when both ids are null", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: null, sessionId: null });

      await mountTracker();

      expect(mockRecordActivityClient).not.toHaveBeenCalled();
    });

    it("does not fire when only visitorId is null", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: null, sessionId: "sess-1" });

      await mountTracker();

      expect(mockRecordActivityClient).not.toHaveBeenCalled();
    });

    it("does not fire when only sessionId is null", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: null });

      await mountTracker();

      expect(mockRecordActivityClient).not.toHaveBeenCalled();
    });

    it("fires once identity resolves after mount", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: null, sessionId: null });

      const { rerender } = await mountTracker();
      expect(mockRecordActivityClient).not.toHaveBeenCalled();

      // Identity resolves
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });
      rerender(<PageViewTracker />);

      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());
      expect(mockRecordActivityClient).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "visitorActivity.page.viewed",
          visitorId: "vis-1",
          sessionId: "sess-1",
          pageType: "homepage",
          pageUrl: "/",
        })
      );
      // No referrerPageType on first fire (prevPathname was null at mount)
      expect(lastPayload().referrerPageType).toBeUndefined();
    });
  });

  // ─── First page load ──────────────────────────────────────────────────────

  describe("first page load", () => {
    it("fires with correct pageType and no referrerPageType", async () => {
      mockUsePathname.mockReturnValue("/search/abc-123/results");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      await mountTracker();

      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());
      expect(lastPayload().type).toBe("visitorActivity.page.viewed");
      expect(lastPayload().pageType).toBe("search_results");
      expect(lastPayload().pageUrl).toBe("/search/abc-123/results");
      expect(lastPayload().referrerPageType).toBeUndefined();
    });
  });

  // ─── Pathname navigation ──────────────────────────────────────────────────

  describe("pathname navigation", () => {
    it("fires on each distinct pathname change", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      const { rerender } = await mountTracker();
      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());
      const countAfterMount = mockRecordActivityClient.mock.calls.length;

      // First navigation
      mockUsePathname.mockReturnValue("/search");
      rerender(<PageViewTracker />);
      await waitFor(() =>
        expect(mockRecordActivityClient.mock.calls.length).toBeGreaterThan(countAfterMount)
      );
      const countAfterFirst = mockRecordActivityClient.mock.calls.length;

      // Second navigation
      mockUsePathname.mockReturnValue("/used-cars/details/toyota/camry/le/2023/1HGBH41JXMN109186");
      rerender(<PageViewTracker />);
      await waitFor(() =>
        expect(mockRecordActivityClient.mock.calls.length).toBeGreaterThan(countAfterFirst)
      );

      // Every nav produced at least one call with the right type
      for (const call of mockRecordActivityClient.mock.calls) {
        const payload = (call as unknown as [Record<string, unknown>])[0];
        expect(payload.type).toBe("visitorActivity.page.viewed");
      }
    });

    it("does not fire again on rerender with the same pathname", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      const { rerender } = await mountTracker();
      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());
      const countAfterMount = mockRecordActivityClient.mock.calls.length;

      // Rerender with no pathname change
      rerender(<PageViewTracker />);
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockRecordActivityClient.mock.calls.length).toBe(countAfterMount);
    });
  });

  // ─── referrerPageType derivation ─────────────────────────────────────────

  describe("referrerPageType derivation", () => {
    it("sets referrerPageType to the prior page's type on the second navigation", async () => {
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      const { rerender } = await mountTracker();
      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());

      // Navigate to search
      mockUsePathname.mockReturnValue("/search");
      rerender(<PageViewTracker />);

      await waitFor(() => {
        expect(lastPayload().pageType).toBe("search_results");
      });

      expect(lastPayload().referrerPageType).toBe("homepage");
    });

    it("carries referrerPageType through a multi-hop navigation chain", async () => {
      mockUsePathname.mockReturnValue("/search");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      const { rerender } = await mountTracker();
      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());

      // Navigate to VDP
      mockUsePathname.mockReturnValue("/used-cars/details/toyota/camry/le/2023/1HGBH41JXMN109186");
      rerender(<PageViewTracker />);

      await waitFor(() => {
        expect(lastPayload().pageType).toBe("vehicle_detail");
      });

      expect(lastPayload().referrerPageType).toBe("search_results");
    });
  });

  // ─── Fire-and-forget on failure ───────────────────────────────────────────

  describe("fire-and-forget on rejected request", () => {
    it("logs the error without rethrowing", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation((_msg) => {
        // suppress console output in this test
      });
      mockRecordActivityClient.mockRejectedValue(new Error("Network error"));
      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      await mountTracker();

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      expect(consoleSpy).toHaveBeenCalledWith(
        "[PageViewTracker] Failed to record page.viewed activity:",
        "Network error"
      );
      consoleSpy.mockRestore();
    });

    it("continues recording on subsequent navigations after a failure", async () => {
      vi.spyOn(console, "error").mockImplementation((_msg) => {
        // suppress console output in this test
      });
      mockRecordActivityClient
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue(undefined);

      mockUsePathname.mockReturnValue("/");
      mockUseVisitorIdentity.mockReturnValue({ visitorId: "vis-1", sessionId: "sess-1" });

      const { rerender } = await mountTracker();
      await waitFor(() => expect(mockRecordActivityClient).toHaveBeenCalled());

      // Navigate to search after the failure
      mockUsePathname.mockReturnValue("/search");
      rerender(<PageViewTracker />);

      await waitFor(() => {
        expect(lastPayload().pageType).toBe("search_results");
      });

      vi.restoreAllMocks();
    });
  });
});
