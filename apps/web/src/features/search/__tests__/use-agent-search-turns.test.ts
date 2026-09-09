import { waitFor } from "@testing-library/react";
import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentSearchTurn } from "../lib/agent-search-turns-collection";
import { SearchNotFoundError } from "../services/agent-search-service";

// ─── Mock state ──────────────────────────────────────────────────────────────

const mockCollection = {
  delete: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

let mockLiveQueryResult: { data: AgentSearchTurn[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};

const mockSubmitAgentTurn = vi.fn().mockResolvedValue("turn-id");

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-db", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  not: (expr: unknown) => ({ not: expr }),
  useLiveQuery: () => mockLiveQueryResult,
}));

vi.mock("../hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => mockCollection,
}));

vi.mock("../services/agent-search-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/agent-search-service")>();
  return {
    ...actual,
    submitAgentTurn: (...args: unknown[]) => mockSubmitAgentTurn(...args),
  };
});

import { useAgentSearchTurns } from "../hooks/use-agent-search-turns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEARCH_ID = "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789";
const STUB_LOCATION = { zipCode: "90210", latitude: 34.09, longitude: -118.41 };

function completedTurn(overrides?: Partial<AgentSearchTurn>): AgentSearchTurn {
  return {
    id: "turn-1",
    searchId: SEARCH_ID,
    role: "user",
    query: "SUV under 35k",
    status: "complete",
    submittedAt: Date.now(),
    response: {
      responseMode: "OptionCards",
      summary: "Here are some options.",
      totalCount: 2,
      optionLevel: "Model",
      results: [],
      nextSearchPlan: {
        searchId: SEARCH_ID,
        filters: [{ key: "bodyStyle", values: ["SUV"] }],
      },
    },
    ...overrides,
  } as AgentSearchTurn;
}

function streamingTurn(): AgentSearchTurn {
  return {
    id: "turn-2",
    searchId: SEARCH_ID,
    role: "user",
    query: "hybrid",
    status: "streaming",
    submittedAt: Date.now(),
    beats: [{ beat: "inventory", message: "Checking nearby inventory…", status: "active" }],
  } as AgentSearchTurn;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useAgentSearchTurns", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockLiveQueryResult = { data: [], isLoading: false };
  });

  describe("submitTurn — text query", () => {
    it("calls submitAgentTurn with query and auto-resolved plan from last response", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({
          query: "hybrid SUV",
          location: STUB_LOCATION,
          source: "query",
        });
      });

      expect(mockSubmitAgentTurn).toHaveBeenCalledOnce();
      // params.plan resolved from lastResponsePlan
      const plan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      expect(plan).toEqual({
        searchId: SEARCH_ID,
        filters: [{ key: "bodyStyle", values: ["SUV"] }],
      });
    });

    it("passes query as first arg, trimmed", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({
          query: "  hybrid SUV  ",
          location: STUB_LOCATION,
          source: "query",
        });
      });

      expect(mockSubmitAgentTurn.mock.calls[0]?.[0]?.query).toBe("hybrid SUV");
    });

    it("sends empty-filter plan when last response has no active filters", () => {
      const turnWithEmptyPlan = completedTurn({
        response: {
          responseMode: "InventoryCards",
          summary: "Found vehicles",
          totalCount: 5,
          results: [],
          nextSearchPlan: { searchId: SEARCH_ID, filters: [] },
        },
      } as Partial<AgentSearchTurn>);

      mockLiveQueryResult = { data: [turnWithEmptyPlan], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({ query: "truck", location: STUB_LOCATION, source: "query" });
      });

      const plan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      expect(plan).toEqual({ searchId: SEARCH_ID, filters: [] });
    });
  });

  describe("submitTurn — follow-up row context", () => {
    it("passes the current row's anchor id and canonical card ids", () => {
      const anchor = completedTurn({
        id: "anchor-1",
        response: {
          responseMode: "InventoryCards",
          summary: "Found vehicles",
          totalCount: 2,
          nextSearchPlan: { searchId: SEARCH_ID, filters: [] },
          results: [{ vin: "VIN1" }, { vin: "VIN2" }],
        },
      } as unknown as Partial<AgentSearchTurn>);
      mockLiveQueryResult = { data: [anchor], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({
          query: "tell me about VIN1",
          location: STUB_LOCATION,
          source: "query",
        });
      });

      const params = mockSubmitAgentTurn.mock.calls[0]?.[0];
      expect(params?.anchorTurnId).toBe("anchor-1");
      expect(params?.canonicalCardIds).toEqual(["VIN1", "VIN2"]);
    });
  });

  describe("submitTurn — card click (explicit filters)", () => {
    it("uses explicit filters over response-level plan", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      const cardFilters = [{ key: "make", values: ["Toyota"] }];

      act(() => {
        result.current.submitTurn({
          filters: cardFilters,
          location: STUB_LOCATION,
          autoSubmitted: true,
          source: "card",
        });
      });

      expect(mockSubmitAgentTurn).toHaveBeenCalledOnce();
      const plan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      expect(plan?.filters).toEqual(cardFilters);
    });

    it("passes autoSubmitted flag through", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({
          filters: [{ key: "make", values: ["Toyota"] }],
          location: STUB_LOCATION,
          autoSubmitted: true,
          source: "card",
        });
      });

      // params.autoSubmitted
      expect(mockSubmitAgentTurn.mock.calls[0]?.[0]?.autoSubmitted).toBe(true);
    });
  });

  describe("submitTurn — full plan passthrough", () => {
    it("forwards the entire plan object including extra backend fields", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      const fullPlan = {
        searchId: SEARCH_ID,
        filters: [{ key: "model", values: ["RAV4 Hybrid"] }],
        searchMode: "Inventory",
        responseMode: "InventoryCards",
        optionLevel: "Trim",
      };

      act(() => {
        result.current.submitTurn({
          plan: fullPlan,
          location: STUB_LOCATION,
          autoSubmitted: true,
          source: "card",
        });
      });

      expect(mockSubmitAgentTurn).toHaveBeenCalledOnce();
      const resolvedPlan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      expect(resolvedPlan).toEqual(fullPlan);
      expect(resolvedPlan?.searchMode).toBe("Inventory");
      expect(resolvedPlan?.responseMode).toBe("InventoryCards");
      expect(resolvedPlan?.optionLevel).toBe("Trim");
    });

    it("plan takes priority over filters when both provided", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      const fullPlan = {
        searchId: SEARCH_ID,
        filters: [{ key: "model", values: ["Camry"] }],
        searchMode: "Exploration",
      };

      act(() => {
        result.current.submitTurn({
          plan: fullPlan,
          filters: [{ key: "make", values: ["Toyota"] }],
          location: STUB_LOCATION,
          source: "card",
        });
      });

      const resolvedPlan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      // plan wins over filters
      expect(resolvedPlan?.filters).toEqual([{ key: "model", values: ["Camry"] }]);
      expect(resolvedPlan?.searchMode).toBe("Exploration");
    });

    it("text query forwards last response plan with extra fields", () => {
      const turnWithExtras = completedTurn({
        response: {
          responseMode: "OptionCards",
          summary: "Options for you",
          totalCount: 3,
          optionLevel: "Model",
          results: [],
          nextSearchPlan: {
            searchId: SEARCH_ID,
            filters: [{ key: "bodyStyle", values: ["SUV"] }],
            searchMode: "Inventory",
            responseMode: "InventoryCards",
          },
        },
      } as Partial<AgentSearchTurn>);

      mockLiveQueryResult = { data: [turnWithExtras], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({ query: "hybrid", location: STUB_LOCATION, source: "query" });
      });

      const resolvedPlan = mockSubmitAgentTurn.mock.calls[0]?.[0]?.plan;
      expect(resolvedPlan?.filters).toEqual([{ key: "bodyStyle", values: ["SUV"] }]);
      expect(resolvedPlan?.searchMode).toBe("Inventory");
      expect(resolvedPlan?.responseMode).toBe("InventoryCards");
    });
  });

  describe("submitTurn — guards", () => {
    it("no-ops when neither query nor filters provided", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({ location: STUB_LOCATION, source: "query" });
      });

      expect(mockSubmitAgentTurn).not.toHaveBeenCalled();
    });

    it("no-ops when query is whitespace-only and no filters", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({ query: "   ", location: STUB_LOCATION, source: "query" });
      });

      expect(mockSubmitAgentTurn).not.toHaveBeenCalled();
    });

    it("no-ops when isStreaming is true", () => {
      mockLiveQueryResult = { data: [streamingTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      expect(result.current.isStreaming).toBe(true);

      act(() => {
        result.current.submitTurn({ query: "hello", location: STUB_LOCATION, source: "query" });
      });

      expect(mockSubmitAgentTurn).not.toHaveBeenCalled();
    });

    it("guards a retry query while another turn is streaming", () => {
      const erroredTurn = completedTurn({ status: "error", query: "retry this search" });
      mockLiveQueryResult = { data: [erroredTurn, streamingTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      act(() => {
        result.current.submitTurn({
          query: erroredTurn.query,
          location: STUB_LOCATION,
          source: "query",
        });
      });

      expect(mockSubmitAgentTurn).not.toHaveBeenCalled();
    });
  });

  describe("submitTurn — error handling", () => {
    it("invokes onSearchNotFound when submitAgentTurn rejects with SearchNotFoundError", async () => {
      const onSearchNotFound = vi.fn();
      mockSubmitAgentTurn.mockRejectedValueOnce(
        new SearchNotFoundError(SEARCH_ID, "missing-turn-id")
      );

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID, { onSearchNotFound }));

      act(() => {
        result.current.submitTurn({
          query: "Find me a hybrid",
          location: STUB_LOCATION,
          source: "query",
        });
      });

      await waitFor(() => {
        expect(onSearchNotFound).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("isStreaming", () => {
    it("returns false when last turn is complete", () => {
      mockLiveQueryResult = { data: [completedTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      expect(result.current.isStreaming).toBe(false);
    });

    it("returns true when last turn is pending", () => {
      const pending = completedTurn({ status: "pending" });
      mockLiveQueryResult = { data: [pending], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      expect(result.current.isStreaming).toBe(true);
    });

    it("returns true when last turn is streaming", () => {
      mockLiveQueryResult = { data: [streamingTurn()], isLoading: false };

      const { result } = renderHook(() => useAgentSearchTurns(SEARCH_ID));

      expect(result.current.isStreaming).toBe(true);
    });
  });
});
