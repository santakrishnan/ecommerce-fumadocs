/// <reference types="@testing-library/jest-dom" />

import { act, renderHook, waitFor } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE,
  VDP_SEARCH_FAQ_CARGO_SPACE_FIXTURE,
} from "../../bff/__fixtures__/vdp-search-faq.fixture";
import { useVdpFaqTurns } from "../use-vdp-faq";

// Mock the BFF client fetch
vi.mock("../../services/vdp-faq-client", () => ({
  fetchVdpFaq: vi.fn(),
}));

import { fetchVdpFaq } from "../../services/vdp-faq-client";

const mockFetchVdpFaq = vi.mocked(fetchVdpFaq);

const TEST_VIN = "3TMDZ5BN8NM126690";
const TEST_QUESTION = "How comfortable is the 3rd row seating?";

// Stub options helpers — source is required by SubmitTurnOptions (orchestrator always passes it)
const STUB_LOCATION = { latitude: 0, longitude: 0, zipCode: "00000" };
const stubTurn = (query: string) => ({ query, location: STUB_LOCATION, source: "query" as const });

describe("useVdpFaqTurns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: () => "test-uuid",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts with empty turns and not streaming", () => {
    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    expect(result.current.turns).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });

  // ── First turn: BFF path ──────────────────────────────────────────────────

  it("routes first turn through BFF and maps to AgentSearchTurn", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    // Immediately after submitTurn — pending turn
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0]?.status).toBe("pending");
    expect(result.current.isStreaming).toBe(true);

    // Wait for BFF response
    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("complete");
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.turns[0]?.response?.summary).toBe(
      VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE.data.answer.summary
    );
    expect(result.current.turns[0]?.response?.results).toEqual([]);
    expect(result.current.turns[0]?.response?.totalCount).toBe(0);
    expect(mockFetchVdpFaq).toHaveBeenCalledOnce();
  });

  it("maps suggestedFollowUps to response actions", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("complete");
    });

    const actions = result.current.turns[0]?.response?.actions;
    expect(actions).toHaveLength(1);
    expect(actions?.[0]).toEqual({ label: "What is the cargo space like?", href: "" });
  });

  it("maps cargo BFF cards into ComparisonCards response when present", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_CARGO_SPACE_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn("What is the cargo space like?"));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("complete");
    });

    const response = result.current.turns[0]?.response;
    expect(response?.responseMode).toBe("ComparisonCards");
    if (!response || response.responseMode !== "ComparisonCards") {
      return;
    }

    expect(response.totalCount).toBe(3);
    expect(response.results).toHaveLength(3);
    expect(response.results[0]?.image).toBe("/images/search/highlander-hybrid-2024.png");
    expect(response.results[0]?.nextSearchPlan.searchId).toBe("faq-fixture-trace-cargo");
    expect(response.results[0]?.nextSearchPlan.filters).toEqual([]);
  });

  it("sets turn to error status on BFF fetch failure", async () => {
    mockFetchVdpFaq.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("error");
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it("ignores empty or whitespace-only queries", () => {
    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn("   "));
    });

    expect(result.current.turns).toHaveLength(0);
    expect(mockFetchVdpFaq).not.toHaveBeenCalled();
  });

  it("passes vin, query, and abort signal to fetchVdpFaq", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(mockFetchVdpFaq).toHaveBeenCalledWith(
        TEST_VIN,
        TEST_QUESTION,
        expect.any(AbortSignal)
      );
    });
  });

  // ── Follow-up turns ───────────────────────────────────────────────────────

  it("routes follow-up query turns through BFF for a smooth demo flow", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    // First turn → BFF
    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("complete");
    });

    // Second turn → BFF (still FAQ mock path)
    act(() => {
      result.current.submitTurn(stubTurn("What is the cargo space like?"));
    });

    await waitFor(() => {
      expect(result.current.turns[1]?.status).toBe("complete");
    });

    expect(mockFetchVdpFaq).toHaveBeenCalledTimes(2);
  });

  it("ignores plan-only turns (cards are read-only in VDP overlay)", async () => {
    mockFetchVdpFaq.mockResolvedValue(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("complete");
    });

    // Plan-only turn (no query) — should be a no-op
    act(() => {
      result.current.submitTurn({
        location: STUB_LOCATION,
        source: "card",
        plan: {
          searchId: "test-uuid",
          filters: [{ key: "fuelType", values: ["hybrid"] }],
          searchMode: "semantic",
          responseMode: "OptionCards",
        },
      });
    });

    // No new turn created — still only 1 turn from the query above
    expect(result.current.turns).toHaveLength(1);
    expect(mockFetchVdpFaq).toHaveBeenCalledTimes(1);
  });

  it("retries BFF when an earlier BFF call fails", async () => {
    mockFetchVdpFaq.mockRejectedValueOnce(new Error("Network error"));
    mockFetchVdpFaq.mockResolvedValueOnce(VDP_SEARCH_FAQ_ANSWER_ONLY_FIXTURE);

    const { result } = renderHook(() => useVdpFaqTurns(TEST_VIN));

    // First attempt → BFF fails
    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[0]?.status).toBe("error");
    });

    // Retry → should go to BFF again, not SSE
    act(() => {
      result.current.submitTurn(stubTurn(TEST_QUESTION));
    });

    await waitFor(() => {
      expect(result.current.turns[1]?.status).toBe("complete");
    });

    expect(mockFetchVdpFaq).toHaveBeenCalledTimes(2);
  });
});
