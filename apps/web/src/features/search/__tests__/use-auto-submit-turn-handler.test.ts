import { waitFor } from "@testing-library/react";
import { renderHook } from "@ucmp/vitest-config/test-utils";
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
  isLoading: true,
};

const mockSubmitAgentTurn = vi.fn().mockResolvedValue("turn-id");

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-db", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  useLiveQuery: () => mockLiveQueryResult,
}));

vi.mock("../hooks/use-agent-search-turns-collection", () => ({
  useAgentSearchTurnsCollection: () => mockCollection,
}));

vi.mock("../services/agent-search-service", () => ({
  submitAgentTurn: (...args: unknown[]) => mockSubmitAgentTurn(...args),
  SearchNotFoundError: class SearchNotFoundError extends Error {
    readonly searchId: string;
    readonly turnId: string;
    constructor(searchId: string, turnId: string) {
      super(`Search not found: ${searchId}`);
      this.name = "SearchNotFoundError";
      this.searchId = searchId;
      this.turnId = turnId;
    }
  },
}));

import { useAutoSubmitTurnHandler } from "../hooks/use-auto-submit-turn-handler";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_SEARCH_ID = "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789";
const INVALID_SEARCH_ID = "inventory-14";
const MOCK_EXPIRED_SEARCH_ID = "expired-search-id";
const MOCK_INVALID_SEARCH_ID = "invalid-search-id";
const MOCK_UUID_NOT_FOUND_SEARCH_ID = "00000000-0000-4000-8000-000000000404";

const STUB_LOCATION = {
  zipCode: "90210",
  latitude: 34.09,
  longitude: -118.41,
};

function renderHandler(searchId = VALID_SEARCH_ID) {
  return renderHook(() => useAutoSubmitTurnHandler({ searchId, location: STUB_LOCATION }));
}

function makeQueuedTurn(overrides?: Partial<AgentSearchTurn>): AgentSearchTurn {
  return {
    id: "queued-turn-id",
    searchId: VALID_SEARCH_ID,
    role: "user",
    query: "Find me an SUV",
    status: "queued",
    submittedAt: Date.now(),
    autoSubmitted: true,
    ...overrides,
  };
}

function makeCompleteTurn(overrides?: Partial<AgentSearchTurn>): AgentSearchTurn {
  return {
    id: "complete-turn-id",
    searchId: VALID_SEARCH_ID,
    role: "user",
    query: "Find me a sedan",
    status: "complete",
    submittedAt: Date.now(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.clearAllMocks();
  mockLiveQueryResult = { data: [], isLoading: true };
});

describe("useAutoSubmitTurnHandler", () => {
  describe("status derivation", () => {
    it("returns 'loading' while IDB is settling", () => {
      mockLiveQueryResult = { data: [], isLoading: true };
      const { result } = renderHandler();
      expect(result.current).toBe("loading");
    });

    it("returns 'done' when real turns exist (no auto-submit needed)", () => {
      mockLiveQueryResult = { data: [makeCompleteTurn()], isLoading: false };
      const { result } = renderHandler();
      expect(result.current).toBe("done");
    });

    it("returns 'done' for non-UUID searchIds (skips auto-submit)", () => {
      mockLiveQueryResult = { data: [], isLoading: false };
      const { result } = renderHandler(INVALID_SEARCH_ID);
      expect(result.current).toBe("done");
    });

    it("submits for the mock expired search id even though it is not a UUID", () => {
      mockLiveQueryResult = { data: [], isLoading: false };
      renderHandler(MOCK_EXPIRED_SEARCH_ID);
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          searchId: MOCK_EXPIRED_SEARCH_ID,
          location: STUB_LOCATION,
          signal: expect.any(AbortSignal),
          collection: mockCollection,
          autoSubmitted: true,
        })
      );
    });

    it("submits for the mock invalid search id even though it is not a UUID", () => {
      mockLiveQueryResult = { data: [], isLoading: false };
      renderHandler(MOCK_INVALID_SEARCH_ID);
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          searchId: MOCK_INVALID_SEARCH_ID,
          location: STUB_LOCATION,
          signal: expect.any(AbortSignal),
          collection: mockCollection,
          autoSubmitted: true,
        })
      );
    });

    it("re-submits for the mock UUID not-found search id even if a stale real turn exists", () => {
      mockLiveQueryResult = {
        data: [makeCompleteTurn({ searchId: MOCK_UUID_NOT_FOUND_SEARCH_ID, id: "stale-turn-id" })],
        isLoading: false,
      };

      renderHandler(MOCK_UUID_NOT_FOUND_SEARCH_ID);

      expect(mockCollection.delete).toHaveBeenCalledWith("stale-turn-id");
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          searchId: MOCK_UUID_NOT_FOUND_SEARCH_ID,
          location: STUB_LOCATION,
          signal: expect.any(AbortSignal),
          collection: mockCollection,
          autoSubmitted: true,
        })
      );
    });
  });

  describe("queued turn path", () => {
    it("deletes the queued turn from the collection", () => {
      const queued = makeQueuedTurn();
      mockLiveQueryResult = { data: [queued], isLoading: false };
      renderHandler();
      expect(mockCollection.delete).toHaveBeenCalledWith("queued-turn-id");
    });

    it("calls submitAgentTurn with the queued turn query and autoSubmitted flag", () => {
      const queued = makeQueuedTurn({ query: "Find me an SUV" });
      mockLiveQueryResult = { data: [queued], isLoading: false };
      renderHandler();
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "Find me an SUV",
          searchId: VALID_SEARCH_ID,
          location: STUB_LOCATION,
          signal: expect.any(AbortSignal),
          collection: mockCollection,
          autoSubmitted: true,
        })
      );
    });

    it("only submits once even across re-renders", () => {
      const queued = makeQueuedTurn();
      mockLiveQueryResult = { data: [queued], isLoading: false };
      const { rerender } = renderHandler();
      rerender();
      rerender();
      expect(mockSubmitAgentTurn).toHaveBeenCalledTimes(1);
    });
  });

  describe("zero-turn recovery path", () => {
    it("submits with undefined query when no turns exist for a valid UUID", () => {
      mockLiveQueryResult = { data: [], isLoading: false };
      renderHandler();
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          searchId: VALID_SEARCH_ID,
          location: STUB_LOCATION,
          signal: expect.any(AbortSignal),
          collection: mockCollection,
          autoSubmitted: true,
        })
      );
    });

    it("does not submit when searchId is not a valid UUID", () => {
      mockLiveQueryResult = { data: [], isLoading: false };
      renderHandler(INVALID_SEARCH_ID);
      expect(mockSubmitAgentTurn).toHaveBeenCalledTimes(0);
    });

    it("invokes onSearchNotFound when submitAgentTurn rejects with SearchNotFoundError", async () => {
      const onSearchNotFound = vi.fn();
      mockLiveQueryResult = { data: [], isLoading: false };
      mockSubmitAgentTurn.mockRejectedValueOnce(
        new SearchNotFoundError(VALID_SEARCH_ID, "missing-turn-id")
      );

      renderHook(() =>
        useAutoSubmitTurnHandler({
          searchId: VALID_SEARCH_ID,
          location: STUB_LOCATION,
          onSearchNotFound,
        })
      );

      await waitFor(() => {
        expect(onSearchNotFound).toHaveBeenCalledTimes(1);
      });
    });

    it("does not submit when only aborted turns exist (counts as zero real turns)", () => {
      mockLiveQueryResult = {
        data: [makeCompleteTurn({ status: "aborted", id: "aborted-1" })],
        isLoading: false,
      };
      renderHandler();
      expect(mockSubmitAgentTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined,
          searchId: expect.any(String),
          location: expect.anything(),
          signal: expect.any(AbortSignal),
          collection: expect.anything(),
          autoSubmitted: true,
        })
      );
    });
  });

  describe("normal flow (no auto-submit)", () => {
    it("does not call submitAgentTurn when real turns exist", () => {
      mockLiveQueryResult = { data: [makeCompleteTurn()], isLoading: false };
      renderHandler();
      expect(mockSubmitAgentTurn).toHaveBeenCalledTimes(0);
    });

    it("does not delete anything from the collection", () => {
      mockLiveQueryResult = { data: [makeCompleteTurn()], isLoading: false };
      renderHandler();
      expect(mockCollection.delete).toHaveBeenCalledTimes(0);
    });
  });
});
