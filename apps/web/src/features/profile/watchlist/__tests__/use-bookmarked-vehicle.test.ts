import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WATCHLIST_SINGLE_ITEM_FIXTURE } from "../__fixtures__/watchlist-items.fixture";
import { useBookmarkedVehicle } from "../hooks/use-bookmarked-vehicle";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockHas = vi.fn(() => false);
const FIXTURE_VIN = WATCHLIST_SINGLE_ITEM_FIXTURE[0]?.vin ?? "1HGBH41JXMN109186";

vi.mock("@features/profile/watchlist/hooks/use-bookmarked-vehicles-collection", () => ({
  useBookmarkedVehiclesCollection: () => ({
    has: mockHas,
    insert: mockInsert,
    delete: mockDelete,
  }),
}));

vi.mock("@tanstack/react-db", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  useLiveQuery: (_queryFn: unknown, _deps: unknown[]) => ({
    data: mockHas() ? [{ vin: FIXTURE_VIN }] : [],
    isLoading: false,
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useBookmarkedVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHas.mockReturnValue(false);
  });

  it("returns isBookmarked as false when VIN is not in collection", () => {
    const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));
    expect(result.current.isBookmarked).toBe(false);
  });

  it("returns isBookmarked as true when VIN is in collection", () => {
    mockHas.mockReturnValue(true);
    const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));
    expect(result.current.isBookmarked).toBe(true);
  });

  it("returns isLoading from useLiveQuery", () => {
    const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));
    expect(result.current.isLoading).toBe(false);
  });

  it("returns a toggle function", () => {
    const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));
    expect(typeof result.current.toggle).toBe("function");
  });

  describe("save (toggle when not bookmarked)", () => {
    beforeEach(() => {
      mockHas.mockReturnValue(false);
    });

    it("optimistically inserts VIN into collection", () => {
      const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));

      let toggleResult = false;
      act(() => {
        toggleResult = result.current.toggle();
      });

      expect(toggleResult).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        vin: FIXTURE_VIN,
        vehicleId: "",
        title: "",
        price: 0,
      });
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("unsave (toggle when bookmarked)", () => {
    beforeEach(() => {
      mockHas.mockReturnValue(true);
    });

    it("optimistically removes VIN from collection", () => {
      const { result } = renderHook(() => useBookmarkedVehicle(FIXTURE_VIN));

      let toggleResult = true;
      act(() => {
        toggleResult = result.current.toggle();
      });

      expect(toggleResult).toBe(false);
      expect(mockDelete).toHaveBeenCalledWith(FIXTURE_VIN);
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("VIN validation guard", () => {
    it("returns false and does not insert when VIN is not 17 characters", () => {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: suppress console.error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => useBookmarkedVehicle("short-vin"));

      let toggleResult = true;
      act(() => {
        toggleResult = result.current.toggle();
      });

      expect(toggleResult).toBe(false);
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[useBookmarkedVehicle] VIN must be 17 characters:",
        "short-vin"
      );

      consoleSpy.mockRestore();
    });
  });
});
