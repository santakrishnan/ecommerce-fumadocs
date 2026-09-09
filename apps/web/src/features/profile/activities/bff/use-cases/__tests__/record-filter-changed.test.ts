// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterChangeEntry } from "../../contracts/filter-change-input.schema";

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
import {
  recordFilterAdded,
  recordFilterRemoved,
  recordSmartFilterRemoved,
} from "../record-filter-changed";

// ─── Helpers ────────────────────────────────────────────────────────────────
const SEARCH_ID = "d6669912-1cd7-40ba-869d-d463942bcbb7";
const RESOLVED_IDENTITY = { visitorId: "v1", sessionId: "s1" };
const SAMPLE_FILTER: FilterChangeEntry = { key: "make", filterType: "Enum", value: "toyota" };
const SAMPLE_FILTERS: FilterChangeEntry[] = [
  SAMPLE_FILTER,
  { key: "model", filterType: "Enum", value: "corolla" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockReadVisitorIdentity.mockResolvedValue(RESOLVED_IDENTITY);
  mockRecordActivity.mockResolvedValue({ success: true, data: { accepted: true } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("recordFilterAdded", () => {
  it("records a FilterAddedActivity on the happy path", async () => {
    await recordFilterAdded({
      searchId: SEARCH_ID,
      filter: SAMPLE_FILTER,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith({
      type: "visitorActivity.filter.added",
      visitorId: "v1",
      sessionId: "s1",
      searchId: SEARCH_ID,
      filter: SAMPLE_FILTER,
      filters: SAMPLE_FILTERS,
    });
  });

  it("omits filters when not provided", async () => {
    await recordFilterAdded({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    const event = mockRecordActivity.mock.calls[0]?.[0];
    expect(event).not.toHaveProperty("filters");
    expect(event.filter).toEqual(SAMPLE_FILTER);
  });

  it("skips when searchId is empty", async () => {
    await recordFilterAdded({ searchId: "", filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when the visitor identity is unresolved (anonymous/cold visit)", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

    await recordFilterAdded({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("skips when only the sessionId is missing", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v1", sessionId: null });

    await recordFilterAdded({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("never throws when recordActivity rejects (fire-and-forget)", async () => {
    mockRecordActivity.mockRejectedValue(new Error("upstream down"));

    await expect(
      recordFilterAdded({ searchId: SEARCH_ID, filter: SAMPLE_FILTER })
    ).resolves.toBeUndefined();
  });

  it("never throws when identity resolution rejects", async () => {
    mockReadVisitorIdentity.mockRejectedValue(new Error("cookies unavailable"));

    await expect(
      recordFilterAdded({ searchId: SEARCH_ID, filter: SAMPLE_FILTER })
    ).resolves.toBeUndefined();
    expect(mockRecordActivity).not.toHaveBeenCalled();
  });
});

describe("recordFilterRemoved", () => {
  it("records a FilterRemovedActivity on the happy path", async () => {
    await recordFilterRemoved({
      searchId: SEARCH_ID,
      filter: SAMPLE_FILTER,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith({
      type: "visitorActivity.filter.removed",
      visitorId: "v1",
      sessionId: "s1",
      searchId: SEARCH_ID,
      filter: SAMPLE_FILTER,
      filters: SAMPLE_FILTERS,
    });
  });

  it("omits filters when not provided", async () => {
    await recordFilterRemoved({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    const event = mockRecordActivity.mock.calls[0]?.[0];
    expect(event).not.toHaveProperty("filters");
    expect(event.filter).toEqual(SAMPLE_FILTER);
  });

  it("skips when searchId is empty", async () => {
    await recordFilterRemoved({ searchId: "", filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when the visitor identity is unresolved (anonymous/cold visit)", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

    await recordFilterRemoved({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("skips when only the sessionId is missing", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v1", sessionId: null });

    await recordFilterRemoved({ searchId: SEARCH_ID, filter: SAMPLE_FILTER });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("never throws when recordActivity rejects (fire-and-forget)", async () => {
    mockRecordActivity.mockRejectedValue(new Error("upstream down"));

    await expect(
      recordFilterRemoved({ searchId: SEARCH_ID, filter: SAMPLE_FILTER })
    ).resolves.toBeUndefined();
  });

  it("never throws when identity resolution rejects", async () => {
    mockReadVisitorIdentity.mockRejectedValue(new Error("cookies unavailable"));

    await expect(
      recordFilterRemoved({ searchId: SEARCH_ID, filter: SAMPLE_FILTER })
    ).resolves.toBeUndefined();
    expect(mockRecordActivity).not.toHaveBeenCalled();
  });
});

describe("recordSmartFilterRemoved", () => {
  const SMART_FILTER_NAME = "Popular SUVs";

  it("records a SmartFilterRemovedActivity on the happy path", async () => {
    await recordSmartFilterRemoved({
      searchId: SEARCH_ID,
      name: SMART_FILTER_NAME,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    expect(mockRecordActivity).toHaveBeenCalledWith({
      type: "visitorActivity.smartFilter.removed",
      visitorId: "v1",
      sessionId: "s1",
      searchId: SEARCH_ID,
      name: SMART_FILTER_NAME,
      filters: SAMPLE_FILTERS,
    });
  });

  it("skips when searchId is empty", async () => {
    await recordSmartFilterRemoved({
      searchId: "",
      name: SMART_FILTER_NAME,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when name is empty", async () => {
    await recordSmartFilterRemoved({ searchId: SEARCH_ID, name: "", filters: SAMPLE_FILTERS });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when filters is empty", async () => {
    await recordSmartFilterRemoved({ searchId: SEARCH_ID, name: SMART_FILTER_NAME, filters: [] });

    expect(mockRecordActivity).not.toHaveBeenCalled();
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
  });

  it("skips when the visitor identity is unresolved (anonymous/cold visit)", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

    await recordSmartFilterRemoved({
      searchId: SEARCH_ID,
      name: SMART_FILTER_NAME,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("skips when only the sessionId is missing", async () => {
    mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v1", sessionId: null });

    await recordSmartFilterRemoved({
      searchId: SEARCH_ID,
      name: SMART_FILTER_NAME,
      filters: SAMPLE_FILTERS,
    });

    expect(mockRecordActivity).not.toHaveBeenCalled();
  });

  it("never throws when recordActivity rejects (fire-and-forget)", async () => {
    mockRecordActivity.mockRejectedValue(new Error("upstream down"));

    await expect(
      recordSmartFilterRemoved({
        searchId: SEARCH_ID,
        name: SMART_FILTER_NAME,
        filters: SAMPLE_FILTERS,
      })
    ).resolves.toBeUndefined();
  });

  it("never throws when identity resolution rejects", async () => {
    mockReadVisitorIdentity.mockRejectedValue(new Error("cookies unavailable"));

    await expect(
      recordSmartFilterRemoved({
        searchId: SEARCH_ID,
        name: SMART_FILTER_NAME,
        filters: SAMPLE_FILTERS,
      })
    ).resolves.toBeUndefined();
    expect(mockRecordActivity).not.toHaveBeenCalled();
  });
});
