import { ContinueShoppingConnected } from "@features/landing/components/continue-shopping/continue-shopping-connected";
import { render } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockContinueShoppingVehicles,
  mockSingleVehicle,
} from "../__fixtures__/continue-shopping.fixtures";

// Mock the hook — ContinueShoppingConnected drives itself via useVehicleHistory.
vi.mock("@features/landing/hooks/use-vehicle-history");

const { useVehicleHistory } = await import("@features/landing/hooks/use-vehicle-history");
const mockUseVehicleHistory = vi.mocked(useVehicleHistory);

// Mock the carousel to inspect what props it receives.
const mockCarousel = vi.fn((props: Record<string, unknown>) => (
  <div className={props.className as string} data-testid="continue-shopping-carousel" />
));
vi.mock("@features/landing/components/continue-shopping/continue-shopping-carousel", () => ({
  ContinueShoppingCarousel: (props: Record<string, unknown>) => mockCarousel(props),
}));

const NEW_TODAY_VEHICLES = [
  {
    id: "new-1",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    trim: "SE",
    price: 28_500,
    mileage: 3000,
    imageUrl: "/inventory-card/inventory-card1.png",
    surface: "light" as const,
  },
];

describe("ContinueShoppingConnected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes recently-viewed history from the hook to the carousel", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: mockContinueShoppingVehicles,
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingConnected newToday={NEW_TODAY_VEHICLES} />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: mockContinueShoppingVehicles,
        newToday: NEW_TODAY_VEHICLES,
        isLoading: false,
      })
    );
  });

  it("passes isLoading=true while hook is hydrating", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: [],
      isLoading: true,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingConnected newToday={NEW_TODAY_VEHICLES} />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: [],
        isLoading: true,
      })
    );
  });

  it("passes empty recentlyViewed when history has no items", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: [],
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingConnected newToday={NEW_TODAY_VEHICLES} />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: [],
        isLoading: false,
      })
    );
  });

  it("passes a single vehicle correctly", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: [mockSingleVehicle],
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingConnected newToday={NEW_TODAY_VEHICLES} />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: [mockSingleVehicle],
      })
    );
  });

  it("forwards stickyHeader prop to the carousel", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: mockContinueShoppingVehicles,
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingConnected newToday={NEW_TODAY_VEHICLES} stickyHeader />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        stickyHeader: true,
      })
    );
  });

  describe("deduplication (PEDX01-2810)", () => {
    it("filters out New Today vehicles that share a VIN with Recently Viewed", () => {
      const duplicateVin = "3TMDZ5BN8NM126690";
      mockUseVehicleHistory.mockReturnValue({
        history: mockContinueShoppingVehicles, // contains duplicateVin
        isLoading: false,
        recordView: vi.fn(),
      });

      const newTodayWithDuplicate = [
        {
          id: "nt-dup",
          vin: duplicateVin,
          make: "Toyota",
          model: "Highlander",
          year: 2024,
          trim: "Hybrid XLE",
          price: 44_000,
          mileage: 10_000,
          imageUrl: "/inventory-card/inventory-card1.png",
          surface: "light" as const,
        },
        ...NEW_TODAY_VEHICLES,
      ];

      render(<ContinueShoppingConnected newToday={newTodayWithDuplicate} />);

      expect(mockCarousel).toHaveBeenCalledWith(
        expect.objectContaining({
          newToday: NEW_TODAY_VEHICLES, // duplicate removed
        })
      );
    });

    it("uses id as fallback when vin is undefined", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [{ ...mockSingleVehicle, vin: undefined, id: "shared-id" }],
        isLoading: false,
        recordView: vi.fn(),
      });

      const newTodayWithIdOverlap = [
        {
          id: "shared-id",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          trim: "SE",
          price: 27_000,
          mileage: 25_000,
          imageUrl: "/inventory-card/inventory-card2.png",
          surface: "light" as const,
        },
      ];

      render(<ContinueShoppingConnected newToday={newTodayWithIdOverlap} />);

      expect(mockCarousel).toHaveBeenCalledWith(
        expect.objectContaining({
          newToday: [], // removed because id matches (vin undefined on both)
        })
      );
    });

    it("still renders when all New Today vehicles are deduped but Recently Viewed has items", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [mockSingleVehicle],
        isLoading: false,
        recordView: vi.fn(),
      });

      const newTodaySameVin = [
        {
          id: "nt-same",
          vin: mockSingleVehicle.vin,
          make: "Toyota",
          model: "Corolla",
          year: 2024,
          trim: "Hybrid LE",
          price: 26_000,
          mileage: 5400,
          imageUrl: "/inventory-card/inventory-card1.png",
          surface: "light" as const,
        },
      ];

      render(<ContinueShoppingConnected newToday={newTodaySameVin} />);

      // Should still render because history has 1 item
      expect(mockCarousel).toHaveBeenCalledWith(
        expect.objectContaining({
          recentlyViewed: [mockSingleVehicle],
          newToday: [],
        })
      );
    });
  });

  describe("no-data DOM absence (PEDX01-2683)", () => {
    it("renders nothing when both history and newToday are empty", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(<ContinueShoppingConnected newToday={[]} />);

      expect(container.innerHTML).toBe("");
    });

    it("does not render section wrapper when both sources empty", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(
        <ContinueShoppingConnected className="col-span-full" newToday={[]} />
      );

      expect(container.querySelector(".col-span-full")).toBeNull();
      expect(container.querySelector("section")).toBeNull();
    });

    it("renders wrapper with className when history has data", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: mockContinueShoppingVehicles,
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(
        <ContinueShoppingConnected className="test-wrapper" newToday={[]} />
      );

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
    });

    it("renders wrapper with className when newToday has data", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(
        <ContinueShoppingConnected className="test-wrapper" newToday={NEW_TODAY_VEHICLES} />
      );

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
    });

    it("renders nothing during loading when both sources are empty (avoids skeleton flash)", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: true,
        recordView: vi.fn(),
      });

      const { container } = render(
        <ContinueShoppingConnected className="test-wrapper" newToday={[]} />
      );

      expect(container.querySelector(".test-wrapper")).toBeNull();
    });
  });
});
