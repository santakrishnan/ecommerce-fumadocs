import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { useFuseSearch } from "../use-fuse-search";

// ─── Test data ───────────────────────────────────────────────────────────────

interface Spec {
  label: string;
  value: string;
}

const SPECS: Spec[] = [
  { label: "Horsepower", value: "275 hp" },
  { label: "Torque", value: "310 lb-ft" },
  { label: "Adaptive Cruise Control", value: "Standard" },
  { label: "Leather Steering Wheel", value: "Optional" },
  { label: "All-Wheel Drive", value: "Available" },
  { label: "Acceleration 0-60", value: "5.8s" },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useFuseSearch", () => {
  describe("uncontrolled mode", () => {
    it("returns empty results when query is below minQueryLength", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label", "value"] }));

      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.query).toBe("");
    });

    it("returns fuzzy-matched results for a valid query", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label", "value"] }));

      act(() => {
        result.current.setQuery("horse");
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.hasResults).toBe(true);
      expect(result.current.results[0]?.label).toBe("Horsepower");
    });

    it("matches partial input against indexed fields", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, { keys: ["label"], threshold: 0.4 })
      );

      act(() => {
        result.current.setQuery("Accel");
      });

      expect(result.current.hasResults).toBe(true);
      expect(result.current.results.some((r) => r.label === "Acceleration 0-60")).toBe(true);
    });

    it("matches partial words", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label"] }));

      act(() => {
        result.current.setQuery("leath");
      });

      expect(result.current.hasResults).toBe(true);
      expect(result.current.results[0]?.label).toBe("Leather Steering Wheel");
    });

    it("returns empty results when no match is found", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label", "value"] }));

      act(() => {
        result.current.setQuery("zzzzzzz");
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    it("clears query and results on clearQuery()", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label"] }));

      act(() => {
        result.current.setQuery("torque");
      });

      expect(result.current.hasResults).toBe(true);

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.query).toBe("");
      expect(result.current.results).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it("respects the limit option", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, { keys: ["label", "value"], limit: 2 })
      );

      act(() => {
        result.current.setQuery("a");
      });

      // "a" is below default minQueryLength (2), so no results
      expect(result.current.results).toEqual([]);

      act(() => {
        result.current.setQuery("al");
      });

      expect(result.current.results.length).toBeLessThanOrEqual(2);
    });

    it("respects custom minQueryLength", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, { keys: ["label"], minQueryLength: 4 })
      );

      act(() => {
        result.current.setQuery("hor");
      });

      expect(result.current.isSearching).toBe(false);
      expect(result.current.results).toEqual([]);

      act(() => {
        result.current.setQuery("hors");
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.hasResults).toBe(true);
    });

    it("ignores whitespace-only queries", () => {
      const { result } = renderHook(() => useFuseSearch(SPECS, { keys: ["label"] }));

      act(() => {
        result.current.setQuery("   ");
      });

      expect(result.current.isSearching).toBe(false);
      expect(result.current.results).toEqual([]);
    });
  });

  describe("controlled mode", () => {
    it("uses controlledQuery instead of internal state", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, {
          keys: ["label"],
          controlledQuery: "torque",
        })
      );

      expect(result.current.query).toBe("torque");
      expect(result.current.isSearching).toBe(true);
      expect(result.current.results[0]?.label).toBe("Torque");
    });

    it("returns empty results when controlledQuery is below minQueryLength", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, {
          keys: ["label"],
          controlledQuery: "t",
        })
      );

      expect(result.current.isSearching).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    it("setQuery and clearQuery are no-ops in controlled mode", () => {
      const { result } = renderHook(() =>
        useFuseSearch(SPECS, {
          keys: ["label"],
          controlledQuery: "torque",
        })
      );

      act(() => {
        result.current.setQuery("horsepower");
      });

      // Query should NOT change — parent owns it
      expect(result.current.query).toBe("torque");

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.query).toBe("torque");
    });

    it("reacts to controlledQuery prop changes", () => {
      let controlledQuery = "torque";

      const { result, rerender } = renderHook(() =>
        useFuseSearch(SPECS, {
          keys: ["label"],
          controlledQuery,
        })
      );

      expect(result.current.results[0]?.label).toBe("Torque");

      controlledQuery = "horse";
      rerender();

      expect(result.current.results[0]?.label).toBe("Horsepower");
    });
  });

  describe("index rebuild", () => {
    it("rebuilds the index when items reference changes", () => {
      let items = SPECS;

      const { result, rerender } = renderHook(() =>
        useFuseSearch(items, {
          keys: ["label"],
          controlledQuery: "turbo",
        })
      );

      expect(result.current.hasResults).toBe(false);

      // Add a new item that matches
      items = [...SPECS, { label: "Turbo Boost", value: "Yes" }];
      rerender();

      expect(result.current.hasResults).toBe(true);
      expect(result.current.results[0]?.label).toBe("Turbo Boost");
    });

    it("does NOT rebuild the index when items reference is stable", () => {
      const { result, rerender } = renderHook(() =>
        useFuseSearch(SPECS, {
          keys: ["label"],
          controlledQuery: "horse",
        })
      );

      const firstResult = result.current.results;
      rerender();

      expect(result.current.results).toEqual(firstResult);
    });
  });

  describe("edge cases", () => {
    it("handles empty items array", () => {
      const { result } = renderHook(() =>
        useFuseSearch([] as Spec[], {
          keys: ["label"],
          controlledQuery: "anything",
        })
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.hasResults).toBe(false);
    });

    it("handles items with empty string fields", () => {
      const items: Spec[] = [
        { label: "", value: "" },
        { label: "Valid", value: "item" },
      ];

      const { result } = renderHook(() =>
        useFuseSearch(items, {
          keys: ["label"],
          controlledQuery: "valid",
        })
      );

      expect(result.current.results[0]?.label).toBe("Valid");
    });
  });
});
