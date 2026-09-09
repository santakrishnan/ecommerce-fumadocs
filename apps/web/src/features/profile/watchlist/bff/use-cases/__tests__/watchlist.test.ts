// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: vi.fn(),
}));
vi.mock("../../services/watchlist-mock", () => ({
  mockDeleteWatchlistItem: vi.fn(),
  mockFetchWatchlist: vi.fn(),
  mockPostWatchlistItem: vi.fn(),
}));
vi.mock("../../services/watchlist-upstream", () => ({
  deleteWatchlistItem: vi.fn(),
  fetchWatchlist: vi.fn(),
  postWatchlistItem: vi.fn(),
}));

import { resolveBedService } from "@config/bed-services";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { WATCHLIST_SINGLE_ITEM_FIXTURE } from "../../../__fixtures__/watchlist-items.fixture";
import type { AddToWatchlistRequest } from "../../contracts/watchlist-item.schema";
import {
  mockDeleteWatchlistItem,
  mockFetchWatchlist,
  mockPostWatchlistItem,
} from "../../services/watchlist-mock";
import {
  deleteWatchlistItem,
  fetchWatchlist,
  postWatchlistItem,
} from "../../services/watchlist-upstream";

const mockResolveBedService = vi.mocked(resolveBedService);
const mockReadVisitorIdentity = vi.mocked(readVisitorIdentity);
const mockFetchWatchlistService = vi.mocked(mockFetchWatchlist);
const mockPostWatchlistService = vi.mocked(mockPostWatchlistItem);
const mockDeleteWatchlistService = vi.mocked(mockDeleteWatchlistItem);
const mockFetchWatchlistUpstream = vi.mocked(fetchWatchlist);
const mockPostWatchlistUpstream = vi.mocked(postWatchlistItem);
const mockDeleteWatchlistUpstream = vi.mocked(deleteWatchlistItem);

const IDENTITY = {
  visitorId: "dd07a7b4-e73c-470a-a028-4174307c7794",
  sessionId: "session-123",
};

const ADD_REQUEST: AddToWatchlistRequest = {
  vin: "4T1DAACK0SU158850",
  vehicleId: "veh-camry-xse-2025-8850",
  title: "2025 Toyota Camry XSE Hybrid",
  price: 44_180,
};

describe("watchlist use-cases", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("getWatchlist uses watchlist mock service when NEXT_PUBLIC_MOCKS=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCKS", "true");
    mockReadVisitorIdentity.mockResolvedValue(IDENTITY);
    mockFetchWatchlistService.mockResolvedValue({
      success: true,
      data: WATCHLIST_SINGLE_ITEM_FIXTURE,
    });

    const { getWatchlist } = await import("../watchlist");
    const result = await getWatchlist();

    expect(result.success).toBe(true);
    expect(mockReadVisitorIdentity).toHaveBeenCalledTimes(1);
    expect(mockFetchWatchlistService).toHaveBeenCalledWith(IDENTITY);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockFetchWatchlistUpstream).not.toHaveBeenCalled();
  });

  it("addToWatchlist uses watchlist mock service when NEXT_PUBLIC_MOCKS=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCKS", "true");
    mockReadVisitorIdentity.mockResolvedValue(IDENTITY);
    mockPostWatchlistService.mockResolvedValue({
      success: true,
      data: WATCHLIST_SINGLE_ITEM_FIXTURE,
    });

    const { addToWatchlist } = await import("../watchlist");
    const result = await addToWatchlist(ADD_REQUEST);

    expect(result.success).toBe(true);
    expect(mockReadVisitorIdentity).toHaveBeenCalledTimes(1);
    expect(mockPostWatchlistService).toHaveBeenCalledWith(ADD_REQUEST, IDENTITY);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockPostWatchlistUpstream).not.toHaveBeenCalled();
  });

  it("removeFromWatchlist uses watchlist mock service when NEXT_PUBLIC_MOCKS=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCKS", "true");
    mockReadVisitorIdentity.mockResolvedValue(IDENTITY);
    mockDeleteWatchlistService.mockResolvedValue({ success: true });

    const { removeFromWatchlist } = await import("../watchlist");
    const result = await removeFromWatchlist("4T1DAACK0SU158850");

    expect(result.success).toBe(true);
    expect(mockReadVisitorIdentity).toHaveBeenCalledTimes(1);
    expect(mockDeleteWatchlistService).toHaveBeenCalledWith("4T1DAACK0SU158850", IDENTITY);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockDeleteWatchlistUpstream).not.toHaveBeenCalled();
  });

  it("getWatchlist returns 503 when service is not configured and mocks are disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCKS", "false");
    mockResolveBedService.mockReturnValue(null);

    const { getWatchlist } = await import("../watchlist");
    const result = await getWatchlist();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("InternalError");
      expect(result.error.status).toBe(503);
      expect(result.error.message).toContain("API_UPSTREAM_URL + VISITORS_API_KEY");
    }

    expect(mockResolveBedService).toHaveBeenCalledWith("visitors");
    expect(mockFetchWatchlistService).not.toHaveBeenCalled();
    expect(mockFetchWatchlistUpstream).not.toHaveBeenCalled();
  });
});
