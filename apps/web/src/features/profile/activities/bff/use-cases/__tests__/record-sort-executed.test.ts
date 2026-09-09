// @vitest-environment node
import type {
  SortExecutedActivityNewSortEnumKey,
  SortExecutedActivityPreviousSortEnumKey,
} from "@ucmp/sdk-visitor-profile-api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockReadVisitorIdentity = vi.fn();
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: () => mockReadVisitorIdentity(),
}));

const mockRecordActivity = vi.fn();
vi.mock("../activities", () => ({
  recordActivity: (...args: unknown[]) => mockRecordActivity(...args),
}));

// ─── Import under test AFTER mocks ─────────────────────────────────────────
import { recordSortExecuted } from "../record-sort-executed";

// ─── Helpers ────────────────────────────────────────────────────────────────
const SEARCH_ID = "d6669912-1cd7-40ba-869d-d463942bcbb7";
const RESOLVED_IDENTITY = { visitorId: "v1", sessionId: "s1" };

beforeEach(() => {
  vi.clearAllMocks();
  mockReadVisitorIdentity.mockResolvedValue(RESOLVED_IDENTITY);
  mockRecordActivity.mockResolvedValue({ success: true, data: { accepted: true } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("recordSortExecuted", () => {
  it("records a SortExecutedActivity on a genuine sort change", async () => {
    await recordSortExecuted({
      searchId: SEARCH_ID,
      previousSort: "Recommended",
      newSort: "LowestPrice",
    });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith({
      type: "visitorActivity.sort.executed",
      visitorId: "v1",
      sessionId: "s1",
      searchId: SEARCH_ID,
      previousSort: "Recommended",
      newSort: "LowestPrice",
    });
  });

  it("omits previousSort when not provided", async () => {
    await recordSortExecuted({ searchId: SEARCH_ID, newSort: "NewestYear" });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    const event = mockRecordActivity.mock.calls[0]?.[0];
    expect(event).not.toHaveProperty("previousSort");
    expect(event.newSort).toBe("NewestYear");
  });

  it("skips recording when re-selecting the already-active sort", async () => {
    await recordSortExecuted({
      searchId: SEARCH_ID,
      previousSort: "LowestPrice",
      newSort: "LowestPrice",
    });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("skips when searchId is missing", async () => {
    await recordSortExecuted({ searchId: "", newSort: "LowestPrice" });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when newSort is not a known sort order", async () => {
    await recordSortExecuted({
      searchId: SEARCH_ID,
      newSort: "Bogus" as unknown as SortExecutedActivityNewSortEnumKey,
    });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("ignores an unknown previousSort but still records the change", async () => {
    await recordSortExecuted({
      searchId: SEARCH_ID,
      previousSort: "Bogus" as unknown as SortExecutedActivityPreviousSortEnumKey,
      newSort: "LowestPrice",
    });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    const event = mockRecordActivity.mock.calls[0]?.[0];
    expect(event).not.toHaveProperty("previousSort");
    expect(event.newSort).toBe("LowestPrice");
  });

  it("skips when the visitor identity is unresolved (anonymous/cold visit)", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

    await recordSortExecuted({ searchId: SEARCH_ID, newSort: "LowestPrice" });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("skips when only the sessionId is missing", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v1", sessionId: null });

    await recordSortExecuted({ searchId: SEARCH_ID, newSort: "LowestPrice" });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("never throws when recordActivity rejects (fire-and-forget)", async () => {
    mockRecordActivity.mockRejectedValue(new Error("upstream down"));

    await expect(
      recordSortExecuted({ searchId: SEARCH_ID, newSort: "LowestPrice" })
    ).resolves.toBeUndefined();
  });

  it("never throws when identity resolution rejects", async () => {
    mockReadVisitorIdentity.mockRejectedValue(new Error("cookies unavailable"));

    await expect(
      recordSortExecuted({ searchId: SEARCH_ID, newSort: "LowestPrice" })
    ).resolves.toBeUndefined();
    expect(mockRecordActivity).not.toHaveBeenCalled();
  });
});
