// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPersonalizedSearchCards } from "../services/get-personalized-search-cards";

vi.mock("server-only", () => ({}));

const mockGetSearches = vi.fn();
vi.mock("@features/profile/searches/bff", () => ({
  getSearches: (...args: unknown[]) => mockGetSearches(...args),
}));

const MOCK_SESSIONS = [
  {
    searchId: "a1b2c3d4-1111-4000-8000-000000000001",
    name: "SUVs under $35k",
    query: "family SUV with third row",
    filters: [],
    isSaved: true,
    createdAt: "2026-07-20T14:30:00.000Z",
    lastActiveAt: "2026-07-23T10:15:00.000Z",
  },
  {
    searchId: "a1b2c3d4-2222-4000-8000-000000000002",
    name: null,
    query: "Toyota Tacoma TRD",
    filters: [],
    isSaved: false,
    createdAt: "2026-07-22T09:00:00.000Z",
    lastActiveAt: "2026-07-22T09:05:00.000Z",
  },
  {
    searchId: "a1b2c3d4-3333-4000-8000-000000000003",
    name: null,
    query: null,
    filters: [],
    isSaved: false,
    createdAt: "2026-07-21T08:00:00.000Z",
    lastActiveAt: "2026-07-21T08:00:00.000Z",
  },
];

describe("getPersonalizedSearchCards", () => {
  beforeEach(() => {
    mockGetSearches.mockClear();
  });

  it("returns success: true with mapped cards when BFF succeeds", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it("maps name as headline when present", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [MOCK_SESSIONS[0]] });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.headline).toBe("SUVs under $35k");
  });

  it("falls back to query as headline when name is null", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [MOCK_SESSIONS[1]] });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.headline).toBe("Toyota Tacoma TRD");
  });

  it('falls back to "Saved search" when both name and query are null', async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [MOCK_SESSIONS[2]] });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.headline).toBe("Saved search");
  });

  it("builds href from searchId", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [MOCK_SESSIONS[0]] });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.href).toBe("/search/a1b2c3d4-1111-4000-8000-000000000001");
  });

  it('sets eyebrow to "Continue searching" for all cards', async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards();

    for (const card of result.data) {
      expect(card.eyebrow).toBe("Continue searching");
    }
  });

  it("cycles through static images", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.imageUrl).toBe("/editorial-card/editorial_card_ev.png");
    expect(result.data[1]?.imageUrl).toBe("/editorial-card/editorial_card_trunk.png");
    expect(result.data[2]?.imageUrl).toBe("/editorial-card/editorial_fuel.png");
  });

  it("does not include matches (API does not return counts)", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards();

    for (const card of result.data) {
      expect(card.matches).toBeUndefined();
    }
  });

  it("sets nextSearchPlan with searchId and query", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [MOCK_SESSIONS[0]] });

    const result = await getPersonalizedSearchCards();

    expect(result.data[0]?.nextSearchPlan).toEqual({
      searchId: "a1b2c3d4-1111-4000-8000-000000000001",
      query: "family SUV with third row",
    });
  });

  it("returns success: false when BFF fails", async () => {
    mockGetSearches.mockResolvedValue({
      success: false,
      error: { code: "InternalError", message: "unavailable", status: 503 },
    });

    const result = await getPersonalizedSearchCards();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  it("returns success: true with empty data when no sessions", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: [] });

    const result = await getPersonalizedSearchCards();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("each card has the required shape", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards();

    for (const card of result.data) {
      expect(card).toHaveProperty("eyebrow");
      expect(card).toHaveProperty("headline");
      expect(card).toHaveProperty("href");
      expect(card).toHaveProperty("imageUrl");
      expect(card).toHaveProperty("surface");
      expect(typeof card.eyebrow).toBe("string");
      expect(typeof card.headline).toBe("string");
      expect(typeof card.href).toBe("string");
    }
  });

  it("respects a custom finite limit", async () => {
    mockGetSearches.mockResolvedValue({ success: true, data: MOCK_SESSIONS });

    const result = await getPersonalizedSearchCards({ limit: 2 });

    expect(result.data).toHaveLength(2);
  });

  it("returns all cards when limit is Infinity", async () => {
    const fiveSessions = Array.from({ length: 5 }, (_, i) => ({
      ...MOCK_SESSIONS[0],
      searchId: `id-${i}`,
      name: `Session ${i}`,
    }));
    mockGetSearches.mockResolvedValue({ success: true, data: fiveSessions });

    const result = await getPersonalizedSearchCards({ limit: Number.POSITIVE_INFINITY });

    expect(result.data).toHaveLength(5);
  });

  it("defaults to 3 cards when no options are provided", async () => {
    const fiveSessions = Array.from({ length: 5 }, (_, i) => ({
      ...MOCK_SESSIONS[0],
      searchId: `id-${i}`,
      name: `Session ${i}`,
    }));
    mockGetSearches.mockResolvedValue({ success: true, data: fiveSessions });

    const result = await getPersonalizedSearchCards();

    expect(result.data).toHaveLength(3);
  });
});
