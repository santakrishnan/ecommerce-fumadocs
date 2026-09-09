import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { SubmitTurnOptions } from "../hooks/use-agent-search-turns";
import type { AgentSearchTurn } from "../lib/agent-search-turns-collection";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSetSearchConversationalState = vi.fn();

vi.mock("../context/search-conversational-context", () => ({
  useSearchConversationalContext: () => ({
    setSearchConversationalState: mockSetSearchConversationalState,
  }),
}));

vi.mock("../hooks/use-search-location", () => ({
  useSearchLocation: () => ({
    location: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
    filterLocation: { zipCode: "90210", latitude: 34.09, longitude: -118.41 },
  }),
}));

// Import the hook *after* mocks are set up
import {
  type UseSearchPreferencesRefinementReturn,
  useSearchPreferencesRefinement,
} from "../hooks/use-search-preferences-refinement";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_FILTERS = [
  { key: "price", max: 35_000 },
  { key: "bodyStyle", values: ["SUV"] },
  { key: "year", min: 2022 },
  { key: "fuelType", values: ["Electric"] },
  { key: "exteriorColorFamily", values: ["Blue"] },
];

function buildCompletedTurn(filters = MOCK_FILTERS): AgentSearchTurn {
  return {
    id: "turn-1",
    query: "SUV under 35k",
    role: "user",
    searchId: "search-123",
    status: "complete",
    hasStreamed: true,
    submittedAt: Date.now(),
    response: {
      responseMode: "OptionCards",
      summary: "Here are some options",
      totalCount: 0,
      optionLevel: "Model",
      results: [],
      nextSearchPlan: {
        searchId: "search-123",
        filters,
      },
    },
  } as AgentSearchTurn;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SetupOptions {
  isStreaming?: boolean;
  lastTurnQuery?: string;
  turns?: AgentSearchTurn[];
}

function setup({
  isStreaming = false,
  lastTurnQuery = "SUV under 35k",
  turns = [buildCompletedTurn()],
}: SetupOptions = {}) {
  const submitTurn = vi.fn<(options: SubmitTurnOptions) => void>();

  const { result, rerender } = renderHook(
    (props: { isStreaming: boolean; turns: AgentSearchTurn[] }) =>
      useSearchPreferencesRefinement({
        isStreaming: props.isStreaming,
        lastTurnQuery,
        submitTurn,
        turns: props.turns,
      }),
    { initialProps: { isStreaming, turns } }
  );

  return { result, rerender, submitTurn };
}

/**
 * Simulates removing a preference and saving changes (submits turn).
 */
function dismissAndSave(
  result: { current: UseSearchPreferencesRefinementReturn },
  label = "Electric"
) {
  act(() => {
    result.current.searchPreferences.onDismissPreference?.(label);
  });
  act(() => {
    result.current.searchPreferences.onSave?.();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useSearchPreferencesRefinement", () => {
  describe("preferences derived from turns", () => {
    it("returns empty preferences when no completed turns exist", () => {
      const { result } = setup({ turns: [] });

      expect(result.current.searchPreferences.preferences).toEqual([]);
    });

    it("returns empty preferences when a persisted completed turn has no next search plan", () => {
      const incompleteTurn = buildCompletedTurn();
      (incompleteTurn.response as { nextSearchPlan?: unknown }).nextSearchPlan = undefined;

      const { result } = setup({ turns: [incompleteTurn] });

      expect(result.current.searchPreferences.preferences).toEqual([]);
    });

    it("derives preference labels from the last completed turn's nextSearchPlan.filters", () => {
      const { result } = setup();

      const prefs = result.current.searchPreferences.preferences;
      expect(prefs).toBeDefined();
      expect(prefs?.length).toBe(5);
      // Range filter formatted
      expect(prefs).toContain("Price: up to $35K");
      // Enum values
      expect(prefs).toContain("SUV");
      expect(prefs).toContain("Electric");
      expect(prefs).toContain("Blue");
    });

    it("updates preferences when a new turn completes with different filters", () => {
      const turn1 = buildCompletedTurn(MOCK_FILTERS);
      const { result, rerender } = setup({ turns: [turn1] });

      expect(result.current.searchPreferences.preferences).toContain("Electric");

      const newFilters = [{ key: "bodyStyle", values: ["Sedan"] }];
      const turn2 = buildCompletedTurn(newFilters);

      rerender({ isStreaming: false, turns: [turn1, turn2] });

      expect(result.current.searchPreferences.preferences).toEqual(["Sedan"]);
      expect(result.current.searchPreferences.preferences).not.toContain("Electric");
    });
  });

  describe("when isStreaming is false (happy path)", () => {
    it("calls submitTurn with the reduced filter set", () => {
      const { result, submitTurn } = setup();

      dismissAndSave(result);

      expect(submitTurn).toHaveBeenCalledOnce();
      const options = submitTurn.mock.calls[0]?.[0];
      // The Electric filter should be removed from the submitted filters
      expect(options?.filters).toBeDefined();
      const filterKeys = options?.filters?.map((f) => `${f.key}:${JSON.stringify(f.values)}`);
      expect(filterKeys).not.toContain('fuelType:["Electric"]');
    });

    it("passes refinementNotification to submitTurn", () => {
      const { result, submitTurn } = setup();

      dismissAndSave(result);

      const options = submitTurn.mock.calls[0]?.[0];
      expect(options?.refinementNotification).toContain("Electric");
    });

    it("tags the refinement turn source as 'filters' so it opens a new row", () => {
      const { result, submitTurn } = setup();

      dismissAndSave(result);

      const options = submitTurn.mock.calls[0]?.[0];
      expect(options?.source).toBe("filters");
    });

    it("sets conversational state to refinement", () => {
      const { result } = setup();

      dismissAndSave(result);

      expect(mockSetSearchConversationalState).toHaveBeenCalledWith("refinement");
    });

    it("removes the dismissed preference from the popover list", () => {
      const { result } = setup();

      act(() => {
        result.current.searchPreferences.onDismissPreference?.("Electric");
      });

      expect(result.current.searchPreferences.preferences).not.toContain("Electric");
    });

    it("closing without saving reverts dismissed preferences and does not call submitTurn", () => {
      const { result, submitTurn } = setup();

      act(() => {
        result.current.searchPreferences.onDismissPreference?.("Electric");
      });
      expect(result.current.searchPreferences.preferences).not.toContain("Electric");

      act(() => {
        result.current.searchPreferences.onClose?.();
      });

      expect(submitTurn).not.toHaveBeenCalled();
      expect(result.current.searchPreferences.preferences).toContain("Electric");
    });
  });

  describe("when isStreaming is true (guarded path)", () => {
    it("does NOT call submitTurn", () => {
      const { result, submitTurn } = setup({ isStreaming: true });

      dismissAndSave(result);

      expect(submitTurn).not.toHaveBeenCalled();
    });

    it("does NOT set conversational state", () => {
      mockSetSearchConversationalState.mockClear();
      const { result } = setup({ isStreaming: true });

      dismissAndSave(result);

      expect(mockSetSearchConversationalState).not.toHaveBeenCalled();
    });

    it("reverts dismissed preferences when streaming", () => {
      const { result } = setup({ isStreaming: true });

      act(() => {
        result.current.searchPreferences.onDismissPreference?.("Electric");
      });
      expect(result.current.searchPreferences.preferences).not.toContain("Electric");

      act(() => {
        result.current.searchPreferences.onClose?.();
      });
      // Dismissed state cleared — Electric is back
      expect(result.current.searchPreferences.preferences).toContain("Electric");
    });
  });

  describe("transition from streaming to idle", () => {
    it("allows submission after isStreaming becomes false", () => {
      const turns = [buildCompletedTurn()];
      const { result, rerender, submitTurn } = setup({ isStreaming: true, turns });

      dismissAndSave(result);
      expect(submitTurn).not.toHaveBeenCalled();

      rerender({ isStreaming: false, turns });

      dismissAndSave(result);
      expect(submitTurn).toHaveBeenCalledOnce();
    });
  });

  describe("resetRefinement", () => {
    it("clears dismissed preferences", () => {
      const { result } = setup();

      act(() => {
        result.current.searchPreferences.onDismissPreference?.("Electric");
      });
      expect(result.current.searchPreferences.preferences).not.toContain("Electric");

      act(() => {
        result.current.resetRefinement();
      });

      expect(result.current.searchPreferences.preferences).toContain("Electric");
    });
  });
});
