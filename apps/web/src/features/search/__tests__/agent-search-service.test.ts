// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  AgentSearchTurn,
  AgentSearchTurnsCollection,
} from "../lib/agent-search-turns-collection";
import {
  closeTrailingBeat,
  SearchNotFoundError,
  submitAgentTurn,
  upsertBeat,
} from "../services/agent-search-service";

const SEARCH_ID = "a1b2c3d4-e5f6-4a7b-8c9d-ef0123456789";
const MOCK_NOT_FOUND_SEARCH_ID = "expired-search-id";
const TURN_ID = "11111111-1111-4111-8111-111111111111";
const LOCATION = {
  zipCode: "90210",
  latitude: 34.09,
  longitude: -118.41,
};

const collection = {
  delete: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
} as unknown as AgentSearchTurnsCollection;

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("submitAgentTurn", () => {
  it("deletes the optimistic turn and throws SearchNotFoundError on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        body: null,
      })
    );

    await expect(
      submitAgentTurn({
        query: "Find me an SUV",
        searchId: SEARCH_ID,
        location: LOCATION,
        signal: new AbortController().signal,
        collection,
        turnId: TURN_ID,
        source: "query",
        agentVersion: "v2",
      })
    ).rejects.toBeInstanceOf(SearchNotFoundError);

    expect(collection.insert).toHaveBeenCalledTimes(1);
    expect(collection.delete).toHaveBeenCalledWith(TURN_ID);
    expect(collection.update).not.toHaveBeenCalled();
  });

  it("marks the turn as error for non-404 failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        body: null,
      })
    );

    const returnedTurnId = await submitAgentTurn({
      query: "Find me an SUV",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    expect(returnedTurnId).toBe(TURN_ID);
    expect(collection.delete).not.toHaveBeenCalled();
    expect(collection.update).toHaveBeenCalledTimes(1);
  });

  it("accepts a zip-only location (no coordinates) and posts it verbatim", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, body: null });
    vi.stubGlobal("fetch", fetchMock);

    await submitAgentTurn({
      query: "Find me an SUV",
      searchId: SEARCH_ID,
      // Coordinates omitted — the BFF applies its own DEFAULT_LOCATION.
      location: { zipCode: "10001" },
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(body.location).toEqual({ zipCode: "10001" });
    expect(body.location.latitude).toBeUndefined();
    expect(body.location.longitude).toBeUndefined();
  });

  it("skips optimistic insert for non-UUID mock not-found ids and still throws SearchNotFoundError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        body: null,
      })
    );

    await expect(
      submitAgentTurn({
        query: undefined,
        searchId: MOCK_NOT_FOUND_SEARCH_ID,
        location: LOCATION,
        signal: new AbortController().signal,
        collection,
        turnId: TURN_ID,
        source: "auto",
        agentVersion: "v2",
      })
    ).rejects.toBeInstanceOf(SearchNotFoundError);

    expect(collection.insert).not.toHaveBeenCalled();
    expect(collection.delete).not.toHaveBeenCalled();
    expect(collection.update).not.toHaveBeenCalled();
  });

  it("includes agentVersion in the POST body, sourced from the caller", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, body: null });
    vi.stubGlobal("fetch", fetchMock);

    await submitAgentTurn({
      query: "Find me an SUV",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(body.agentVersion).toBe("v1");
  });

  it("echoes agentVersion = v2 verbatim when that is what was resolved server-side", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, body: null });
    vi.stubGlobal("fetch", fetchMock);

    await submitAgentTurn({
      query: "Find me an SUV",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(body.agentVersion).toBe("v2");
  });
});

// ─── Follow-up classification wiring ─────────────────────────────────────────

/** Builds an SSE ReadableStream from a list of agent events. */
function sseStream(events: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}

/** Replays every collection.update call for a turn id against a draft. */
function applyTurnUpdates(turnId: string): AgentSearchTurn {
  const draft = { status: "pending" } as AgentSearchTurn;
  for (const [id, updater] of vi.mocked(collection.update).mock.calls) {
    if (id === turnId) {
      (updater as (d: AgentSearchTurn) => void)(draft);
    }
  }
  return draft;
}

const followUpResponse = {
  responseMode: "InventoryCards",
  summary: "Here is more on that one.",
  totalCount: 1,
  results: [{ vin: "VIN1" }],
};

describe("upsertBeat / closeTrailingBeat (pure beat-aggregation helpers)", () => {
  it("adds an active beat from a beat+message update", () => {
    const beats = upsertBeat([], {
      beat: "resolve",
      message: "Looking for Tacoma near you…",
      status: "active",
    });
    expect(beats).toEqual([
      { beat: "resolve", message: "Looking for Tacoma near you…", status: "active" },
    ]);
  });

  it("is a no-op when the update has no beat", () => {
    const beats = upsertBeat([], { message: "no beat here", status: "active" });
    expect(beats).toEqual([]);
  });

  it("replaces the message on the same beat instead of adding a new row", () => {
    const afterFirst = upsertBeat([], {
      beat: "resolve",
      message: "Looking for Tacoma…",
      status: "active",
    });
    const afterSecond = upsertBeat(afterFirst, {
      beat: "resolve",
      message: "Narrowing to red Tacoma…",
      status: "active",
    });
    expect(afterSecond).toEqual([
      { beat: "resolve", message: "Narrowing to red Tacoma…", status: "active" },
    ]);
  });

  it("keeps the prior message when the update for the same beat omits one", () => {
    const afterFirst = upsertBeat([], {
      beat: "resolve",
      message: "Looking for Tacoma…",
      status: "active",
    });
    const afterSecond = upsertBeat(afterFirst, { beat: "resolve", status: "active" });
    expect(afterSecond).toEqual([
      { beat: "resolve", message: "Looking for Tacoma…", status: "active" },
    ]);
  });

  it("closes the prior beat as done when a new beat starts", () => {
    const afterFirst = upsertBeat([], {
      beat: "resolve",
      message: "Looking for Tacoma…",
      status: "active",
    });
    const afterSecond = upsertBeat(afterFirst, {
      beat: "inventory",
      message: "Checking nearby inventory…",
      status: "active",
    });
    expect(afterSecond).toEqual([
      { beat: "resolve", message: "Looking for Tacoma…", status: "done" },
      { beat: "inventory", message: "Checking nearby inventory…", status: "active" },
    ]);
  });

  it("marks the beat as done on a successful ToolResult", () => {
    const afterFirst = upsertBeat([], {
      beat: "inventory",
      message: "Checking nearby inventory…",
      status: "active",
    });
    const afterResult = upsertBeat(afterFirst, {
      beat: "inventory",
      message: "About 20 near you",
      status: "done",
    });
    expect(afterResult).toEqual([
      { beat: "inventory", message: "About 20 near you", status: "done" },
    ]);
  });

  it("marks the beat as error on a failed ToolResult", () => {
    const afterFirst = upsertBeat([], {
      beat: "inventory",
      message: "Checking nearby inventory…",
      status: "active",
    });
    const afterError = upsertBeat(afterFirst, {
      beat: "inventory",
      message: "Inventory lookup failed",
      status: "error",
    });
    expect(afterError).toEqual([
      { beat: "inventory", message: "Inventory lookup failed", status: "error" },
    ]);
  });

  it("closeTrailingBeat marks a trailing active beat done and is a no-op otherwise", () => {
    const active = [{ beat: "resolve", message: "Looking…", status: "active" as const }];
    expect(closeTrailingBeat(active, "done")).toEqual([
      { beat: "resolve", message: "Looking…", status: "done" },
    ]);
    // Already done — no-op.
    const done = [{ beat: "resolve", message: "Looking…", status: "done" as const }];
    expect(closeTrailingBeat(done, "error")).toEqual(done);
    // Empty — no-op.
    expect(closeTrailingBeat([], "done")).toEqual([]);
  });
});

describe("submitAgentTurn — beats aggregation (end-to-end via SSE)", () => {
  it("closes the trailing active beat as done on Complete", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: sseStream([
          {
            type: "Status",
            searchId: SEARCH_ID,
            stage: "Resolving",
            beat: "resolve",
            message: "Looking for Tacoma…",
          },
          {
            type: "Complete",
            payload: { searchId: SEARCH_ID, searchMode: "Inventory", response: followUpResponse },
          },
        ]),
      })
    );

    await submitAgentTurn({
      query: "Tacoma",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    const draft = applyTurnUpdates(TURN_ID);
    expect(draft.beats).toEqual([
      { beat: "resolve", message: "Looking for Tacoma…", status: "done" },
    ]);
    expect(draft.status).toBe("complete");
  });

  it("marks the trailing beat as error when the stream closes without Complete/Error, and sets turn.status to error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: sseStream([
          {
            type: "Status",
            searchId: SEARCH_ID,
            stage: "Resolving",
            beat: "resolve",
            message: "Looking for Tacoma…",
          },
          // Stream ends here — no Complete/Error frame (e.g. a V1 timeout).
        ]),
      })
    );
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await submitAgentTurn({
      query: "Tacoma",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    const draft = applyTurnUpdates(TURN_ID);
    expect(draft.beats).toEqual([
      { beat: "resolve", message: "Looking for Tacoma…", status: "error" },
    ]);
    // develop's failTurnOnIncompleteStream now sets status to "error".
    expect(draft.status).toBe("error");
    consoleErrorSpy.mockRestore();
  });
});

describe("submitAgentTurn — SSE errors", () => {
  it("stores the SSE error code and message while settling the turn", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: sseStream([
          {
            type: "Status",
            searchId: SEARCH_ID,
            stage: "Resolving",
            beat: "resolve",
            message: "Looking for an SUV...",
          },
          {
            type: "Error",
            error: { code: "SearchToolTimeout", message: "The search tool timed out." },
          },
        ]),
      })
    );

    await submitAgentTurn({
      query: "Find me an SUV",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      agentVersion: "v2",
    });

    const draft = applyTurnUpdates(TURN_ID);
    expect(draft.status).toBe("error");
    expect(draft.errorCode).toBe("SearchToolTimeout");
    expect(draft.errorMessage).toBe("The search tool timed out.");
    expect(draft.beats).toEqual([
      { beat: "resolve", message: "Looking for an SUV...", status: "error" },
    ]);
  });
});

describe("submitAgentTurn — follow-up classification", () => {
  it("tags a completing turn as a follow-up of its row", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: sseStream([
          { type: "Status", stage: "Executing", searchId: SEARCH_ID },
          {
            type: "Complete",
            payload: { searchId: SEARCH_ID, searchMode: "Inventory", response: followUpResponse },
          },
        ]),
      })
    );

    await submitAgentTurn({
      query: "tell me more about VIN1",
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "query",
      anchorTurnId: "anchor-1",
      canonicalCardIds: ["VIN1"],
      agentVersion: "v2",
    });

    const draft = applyTurnUpdates(TURN_ID);
    expect(draft.status).toBe("complete");
    expect(draft.parentTurnId).toBe("anchor-1");
    expect(draft.matchedCardIds).toEqual(["VIN1"]);
  });

  it("never folds a card-click turn into the row (always a new row)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: sseStream([
          {
            type: "Complete",
            payload: { searchId: SEARCH_ID, searchMode: "Inventory", response: followUpResponse },
          },
        ]),
      })
    );

    await submitAgentTurn({
      searchId: SEARCH_ID,
      location: LOCATION,
      signal: new AbortController().signal,
      collection,
      turnId: TURN_ID,
      source: "card",
      anchorTurnId: "anchor-1",
      canonicalCardIds: ["VIN1"],
      plan: { filters: [{ key: "make", values: ["Toyota"] }] },
      agentVersion: "v2",
    });

    const draft = applyTurnUpdates(TURN_ID);
    expect(draft.status).toBe("complete");
    expect(draft.parentTurnId).toBeUndefined();
    expect(draft.matchedCardIds).toBeUndefined();
  });
});
