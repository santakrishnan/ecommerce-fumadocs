// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilterChangeEntry } from "../../bff/contracts/filter-change-input.schema";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// The actions validate input then delegate to the use cases; mock the use cases
// so we can assert whether a payload passed validation and was forwarded.
const mockRecordFilterAdded = vi.fn();
const mockRecordFilterRemoved = vi.fn();
const mockRecordSmartFilterRemoved = vi.fn();

vi.mock("../../bff/use-cases/record-filter-changed", () => ({
  recordFilterAdded: (input: unknown) => mockRecordFilterAdded(input),
  recordFilterRemoved: (input: unknown) => mockRecordFilterRemoved(input),
  recordSmartFilterRemoved: (input: unknown) => mockRecordSmartFilterRemoved(input),
}));

// ─── Import under test AFTER mocks ─────────────────────────────────────────
import {
  recordFilterAddedAction,
  recordFilterRemovedAction,
  recordSmartFilterRemovedAction,
} from "../record-filter-changed";

const SEARCH_ID = "d6669912-1cd7-40ba-869d-d463942bcbb7";
const ENUM_FILTER: FilterChangeEntry = { key: "make", filterType: "Enum", value: "toyota" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordFilterAddedAction", () => {
  it("forwards valid input to the use case", async () => {
    await recordFilterAddedAction({ searchId: SEARCH_ID, filter: ENUM_FILTER });

    expect(mockRecordFilterAdded).toHaveBeenCalledTimes(1);
    expect(mockRecordFilterAdded).toHaveBeenCalledWith({
      searchId: SEARCH_ID,
      filter: ENUM_FILTER,
    });
  });

  it("drops input with a non-uuid searchId without calling the use case", async () => {
    await recordFilterAddedAction({
      searchId: "not-a-uuid",
      filter: ENUM_FILTER,
    } as unknown as Parameters<typeof recordFilterAddedAction>[0]);

    expect(mockRecordFilterAdded).not.toHaveBeenCalled();
  });

  it("drops a Range filter that carries neither min nor max", async () => {
    await recordFilterAddedAction({
      searchId: SEARCH_ID,
      filter: { key: "price", filterType: "Range" },
    } as unknown as Parameters<typeof recordFilterAddedAction>[0]);

    expect(mockRecordFilterAdded).not.toHaveBeenCalled();
  });

  it("drops an unknown dimension key", async () => {
    await recordFilterAddedAction({
      searchId: SEARCH_ID,
      filter: { key: "notADimension", filterType: "Enum", value: "x" },
    } as unknown as Parameters<typeof recordFilterAddedAction>[0]);

    expect(mockRecordFilterAdded).not.toHaveBeenCalled();
  });
});

describe("recordFilterRemovedAction", () => {
  it("forwards valid input to the use case", async () => {
    await recordFilterRemovedAction({ searchId: SEARCH_ID, filter: ENUM_FILTER });

    expect(mockRecordFilterRemoved).toHaveBeenCalledTimes(1);
  });

  it("drops input with an invalid filter shape", async () => {
    await recordFilterRemovedAction({
      searchId: SEARCH_ID,
      filter: { key: "make", filterType: "Enum" },
    } as unknown as Parameters<typeof recordFilterRemovedAction>[0]);

    expect(mockRecordFilterRemoved).not.toHaveBeenCalled();
  });
});

describe("recordSmartFilterRemovedAction", () => {
  it("forwards valid input to the use case", async () => {
    await recordSmartFilterRemovedAction({
      searchId: SEARCH_ID,
      name: "Family SUVs",
      filters: [ENUM_FILTER],
    });

    expect(mockRecordSmartFilterRemoved).toHaveBeenCalledTimes(1);
  });

  it("drops a smart-filter removal with an empty filters array", async () => {
    await recordSmartFilterRemovedAction({
      searchId: SEARCH_ID,
      name: "Family SUVs",
      filters: [],
    });

    expect(mockRecordSmartFilterRemoved).not.toHaveBeenCalled();
  });

  it("drops a smart-filter removal with an empty name", async () => {
    await recordSmartFilterRemovedAction({
      searchId: SEARCH_ID,
      name: "",
      filters: [ENUM_FILTER],
    });

    expect(mockRecordSmartFilterRemoved).not.toHaveBeenCalled();
  });
});
