// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { AgentSearchResponse, AgentSearchTurn } from "../agent-search-turns-collection";
import {
  classifyFollowUp,
  getCanonicalCardTurn,
  getCurrentRowContext,
  getNonPillCardIds,
  isAllPills,
} from "../response-cards";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resp(results: unknown[]): AgentSearchResponse {
  return { results } as unknown as AgentSearchResponse;
}

function turn(response: AgentSearchResponse | undefined): AgentSearchTurn {
  return { response } as AgentSearchTurn;
}

// V2 card shapes
const v2Inventory = (vin: string) => ({ vin, vehicleInfo: {} });
const v2Option = (id: string) => ({ id, nextSearchPlan: {} });
// Base mapped card shapes
const basePill = (id?: string) => ({ type: "pill", id });
const baseSpec = (id: string) => ({ type: "spec", id });
const baseInventory = (id: string) => ({ type: "inventory", id });

// ─── getNonPillCardIds ────────────────────────────────────────────────────────

describe("getNonPillCardIds", () => {
  it("returns [] for undefined or empty responses", () => {
    expect(getNonPillCardIds(undefined)).toEqual([]);
    expect(getNonPillCardIds(resp([]))).toEqual([]);
  });

  it("reads vin from V2 inventory cards", () => {
    expect(getNonPillCardIds(resp([v2Inventory("VIN1"), v2Inventory("VIN2")]))).toEqual([
      "VIN1",
      "VIN2",
    ]);
  });

  it("reads id from V2 option cards and base spec/inventory cards", () => {
    expect(
      getNonPillCardIds(resp([v2Option("opt-1"), baseSpec("spec-1"), baseInventory("inv-1")]))
    ).toEqual(["opt-1", "spec-1", "inv-1"]);
  });

  it("skips base pills and id-less cards", () => {
    expect(getNonPillCardIds(resp([basePill("pill-1"), baseSpec("spec-1"), basePill()]))).toEqual([
      "spec-1",
    ]);
  });
});

// ─── isAllPills ────────────────────────────────────────────────────────────────

describe("isAllPills", () => {
  it("is false for empty or undefined responses", () => {
    expect(isAllPills(undefined)).toBe(false);
    expect(isAllPills(resp([]))).toBe(false);
  });

  it("is true only when every card is a pill", () => {
    expect(isAllPills(resp([basePill("a"), basePill("b")]))).toBe(true);
    expect(isAllPills(resp([basePill("a"), baseSpec("b")]))).toBe(false);
  });

  it("is false for V2 responses (no pills exist)", () => {
    expect(isAllPills(resp([v2Inventory("VIN1")]))).toBe(false);
  });
});

// ─── getCanonicalCardTurn ────────────────────────────────────────────────────

describe("getCanonicalCardTurn", () => {
  it("returns the first turn carrying non-pill cards", () => {
    const exploringA = turn(resp([basePill("a")]));
    const exploringB = turn(resp(undefined as unknown as unknown[]));
    const cardTurn = turn(resp([baseSpec("spec-1")]));
    expect(getCanonicalCardTurn([exploringA, exploringB, cardTurn])).toBe(cardTurn);
  });

  it("is undefined while the whole row is exploring", () => {
    expect(getCanonicalCardTurn([turn(resp([basePill("a")])), turn(undefined)])).toBeUndefined();
  });
});

// ─── classifyFollowUp ─────────────────────────────────────────────────────────

describe("classifyFollowUp", () => {
  it("treats card and filter clicks as new turns", () => {
    expect(classifyFollowUp("card", true, [], resp([basePill("a")])).isFollowUp).toBe(false);
    expect(
      classifyFollowUp("filters", true, ["VIN1"], resp([v2Inventory("VIN1")])).isFollowUp
    ).toBe(false);
  });

  it("is a new turn when there is no anchor row", () => {
    expect(classifyFollowUp("query", false, [], resp([basePill("a")])).isFollowUp).toBe(false);
  });

  it("folds any response into an exploring row", () => {
    expect(classifyFollowUp("query", true, [], resp([basePill("a")]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
    expect(classifyFollowUp("pill", true, [], resp([baseSpec("spec-1")]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
  });

  describe("getCurrentRowContext", () => {
    it("keeps the prior non-error row as the anchor after a trailing error", () => {
      const anchor = {
        id: "anchor-1",
        role: "user",
        searchId: "search-1",
        status: "complete",
        submittedAt: 1,
        response: {
          ...resp([v2Inventory("VIN1")]),
          nextSearchPlan: { searchId: "search-1", filters: [] },
        },
      } as AgentSearchTurn;
      const error = {
        id: "error-1",
        status: "error",
        query: "Find another SUV",
      } as AgentSearchTurn;

      expect(getCurrentRowContext([anchor, error])).toEqual({
        anchorTurnId: "anchor-1",
        canonicalCardIds: ["VIN1"],
        canonicalFilters: [],
      });
    });

    it("returns no anchor when an errored turn is the only candidate", () => {
      expect(
        getCurrentRowContext([
          { id: "error-1", status: "error", query: "Find an SUV" } as AgentSearchTurn,
        ])
      ).toEqual({
        anchorTurnId: undefined,
        canonicalCardIds: [],
        canonicalFilters: undefined,
      });
    });

    it("does not require a next search plan on a persisted completed turn", () => {
      const incompleteTurn = {
        id: "turn-1",
        role: "user",
        searchId: "search-1",
        status: "complete",
        submittedAt: 1,
        response: resp([v2Inventory("VIN1")]),
      } as AgentSearchTurn;

      expect(getCurrentRowContext([incompleteTurn])).toEqual({
        anchorTurnId: "turn-1",
        canonicalCardIds: ["VIN1"],
        canonicalFilters: undefined,
      });
    });
  });

  it("folds a resolved row only for a single card already in the canonical set", () => {
    expect(classifyFollowUp("query", true, ["VIN1", "VIN2"], resp([v2Inventory("VIN1")]))).toEqual({
      isFollowUp: true,
      matchedCardIds: ["VIN1"],
    });
  });

  it("folds a zero-card response into a resolved row as a text-only follow-up", () => {
    expect(classifyFollowUp("query", true, ["VIN1", "VIN2"], resp([]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
    expect(classifyFollowUp("pill", true, ["VIN1"], resp([]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
    expect(classifyFollowUp("auto", true, ["VIN1"], resp([]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
    // Pill-only response: getNonPillCardIds returns [] (pills are excluded),
    // so it's treated the same as a zero-card text-only response.
    expect(classifyFollowUp("query", true, ["VIN1"], resp([basePill("a")]))).toEqual({
      isFollowUp: true,
      matchedCardIds: [],
    });
  });

  it("opens a new turn on a resolved row for unmatched or multi-card responses", () => {
    expect(classifyFollowUp("query", true, ["VIN1"], resp([v2Inventory("VIN9")])).isFollowUp).toBe(
      false
    );
    expect(
      classifyFollowUp("query", true, ["VIN1"], resp([v2Inventory("VIN1"), v2Inventory("VIN2")]))
        .isFollowUp
    ).toBe(false);
  });

  it("opens a new turn when a single matched card has different filters than the row", () => {
    const canonicalFilters = [{ key: "make", value: "Toyota" }];
    const newFilters = [
      { key: "make", value: "Toyota" },
      { key: "exteriorColor", value: "White" },
    ];
    const response = {
      ...resp([v2Inventory("VIN1")]),
      nextSearchPlan: { filters: newFilters },
    } as AgentSearchResponse;

    expect(classifyFollowUp("query", true, ["VIN1", "VIN2"], response, canonicalFilters)).toEqual({
      isFollowUp: false,
      matchedCardIds: [],
    });
  });

  it("opens a new turn when a persisted response has no next search plan", () => {
    const canonicalFilters = [{ key: "make", value: "Toyota" }];

    expect(
      classifyFollowUp("query", true, ["VIN1"], resp([v2Inventory("VIN1")]), canonicalFilters)
    ).toEqual({
      isFollowUp: false,
      matchedCardIds: [],
    });
  });

  it("still folds a single matched card when filters are unchanged", () => {
    const filters = [{ key: "make", value: "Toyota" }];
    const response = {
      ...resp([v2Inventory("VIN1")]),
      nextSearchPlan: { filters },
    } as AgentSearchResponse;

    expect(classifyFollowUp("query", true, ["VIN1", "VIN2"], response, filters)).toEqual({
      isFollowUp: true,
      matchedCardIds: ["VIN1"],
    });
  });

  it("treats filters with same values in different order as equal", () => {
    const canonicalFilters = [
      { key: "model", value: "rav4" },
      { key: "exteriorColorFamily", values: ["Black", "Red"] },
    ];
    const response = {
      ...resp([v2Inventory("VIN1")]),
      nextSearchPlan: {
        filters: [
          { key: "model", value: "rav4" },
          { key: "exteriorColorFamily", values: ["Red", "Black"] },
        ],
      },
    } as AgentSearchResponse;

    expect(classifyFollowUp("query", true, ["VIN1", "VIN2"], response, canonicalFilters)).toEqual({
      isFollowUp: true,
      matchedCardIds: ["VIN1"],
    });
  });

  it("treats undefined canonicalFilters as no filter constraint (backward compat)", () => {
    expect(
      classifyFollowUp("query", true, ["VIN1", "VIN2"], resp([v2Inventory("VIN1")]), undefined)
    ).toEqual({ isFollowUp: true, matchedCardIds: ["VIN1"] });
  });

  it("opens a new turn when user removes a color filter and gets one matching VIN (multi-step refinement)", () => {
    // Simulates: step 2 yielded 7 VINs with model=rav4 + color=[Black, Red].
    // Step 3: user removes Black → 1 VIN back (Red only), which existed in
    // step 2's canonical set. Filters differ → new turn, not a highlight.
    const step2CanonicalIds = ["V1", "V2", "V3", "V4", "V5", "V6", "V7"];
    const step2Filters = [
      { key: "model", value: "rav4" },
      { key: "exteriorColorFamily", values: ["Black", "Red"] },
    ];
    const step3Response = {
      ...resp([v2Inventory("V3")]),
      nextSearchPlan: {
        filters: [
          { key: "model", value: "rav4" },
          { key: "exteriorColorFamily", values: ["Red"] },
        ],
      },
    } as AgentSearchResponse;

    expect(classifyFollowUp("query", true, step2CanonicalIds, step3Response, step2Filters)).toEqual(
      { isFollowUp: false, matchedCardIds: [] }
    );
  });
});
