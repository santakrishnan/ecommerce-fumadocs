import type { VehicleHistoryItem } from "@shared/lib/vehicle-history/vehicle-history-collection";
import { render } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the hook — ContinueShoppingVdpConnected drives itself via useVehicleHistory.
vi.mock("@features/landing/hooks/use-vehicle-history");

const { useVehicleHistory } = await import("@features/landing/hooks/use-vehicle-history");
const mockUseVehicleHistory = vi.mocked(useVehicleHistory);

// Mock the carousel to inspect what props it receives.
const mockCarousel = vi.fn((props: Record<string, unknown>) => (
  <div className={props.className as string} data-testid="vdp-continue-shopping-carousel" />
));
vi.mock(
  "@features/vehicle-detail/components/continue-shopping-vdp/continue-shopping-vdp-carousel",
  () => ({
    ContinueShoppingVdpCarousel: (props: Record<string, unknown>) => mockCarousel(props),
  })
);

const { ContinueShoppingVdpConnected } = await import("../continue-shopping-vdp-connected");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = Date.now();

const mockVehicles: VehicleHistoryItem[] = [
  {
    id: "v-1",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid XLE",
    vin: "3TMDZ5BN8NM126690",
    price: 45_000,
    mileage: 15_243,
    imageUrl: "/img/v-1.png",
    showBadge: false,
    viewedAt: NOW - 3000,
    href: "/used-cars/details/toyota/highlander/hybrid-xle/2024/3TMDZ5BN8NM126690",
  },
  {
    id: "v-2",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    vin: "2T1BURHE0JC048817",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "/img/v-2.png",
    showBadge: false,
    viewedAt: NOW - 2000,
    href: "/used-cars/details/toyota/camry/se/2023/2T1BURHE0JC048817",
  },
  {
    id: "v-3",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    vin: "JTMRJREV5HD107836",
    price: 42_000,
    mileage: 8120,
    imageUrl: "/img/v-3.png",
    showBadge: false,
    viewedAt: NOW - 1000,
    href: "/used-cars/details/toyota/rav4/prime/2024/JTMRJREV5HD107836",
  },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ContinueShoppingVdpConnected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes recently-viewed history excluding the current VIN", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: mockVehicles,
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingVdpConnected excludeVin="3TMDZ5BN8NM126690" />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: mockVehicles.filter((v) => v.vin !== "3TMDZ5BN8NM126690"),
        isLoading: false,
      })
    );
  });

  it("passes all vehicles when excludeVin matches none", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: mockVehicles,
      isLoading: false,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingVdpConnected excludeVin="NONEXISTENT_VIN_000" />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: mockVehicles,
      })
    );
  });

  it("passes isLoading=true while hook is hydrating", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: [],
      isLoading: true,
      recordView: vi.fn(),
    });

    render(<ContinueShoppingVdpConnected excludeVin="ANY_VIN" />);

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        recentlyViewed: [],
        isLoading: true,
      })
    );
  });

  it("forwards className to the carousel", () => {
    mockUseVehicleHistory.mockReturnValue({
      history: mockVehicles,
      isLoading: false,
      recordView: vi.fn(),
    });

    render(
      <ContinueShoppingVdpConnected className="test-class" excludeVin="NONEXISTENT_VIN_000" />
    );

    expect(mockCarousel).toHaveBeenCalledWith(
      expect.objectContaining({
        className: "test-class",
      })
    );
  });

  describe("exclude by id fallback", () => {
    it("uses id when vin is undefined for exclusion", () => {
      const vehiclesNoVin: VehicleHistoryItem[] = [
        {
          id: "current-vehicle-id",
          make: "Toyota",
          model: "Highlander",
          year: 2024,
          trim: "Hybrid XLE",
          vin: undefined,
          price: 45_000,
          mileage: 15_243,
          imageUrl: "/img/v-1.png",
          showBadge: false,
          viewedAt: NOW - 3000,
          href: "/used-cars/details/toyota/highlander/hybrid-xle/2024/current-vehicle-id",
        },
        {
          id: "other-vehicle-id",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          trim: "SE",
          vin: undefined,
          price: 28_500,
          mileage: 22_500,
          imageUrl: "/img/v-2.png",
          showBadge: false,
          viewedAt: NOW - 2000,
          href: "/used-cars/details/toyota/camry/se/2023/other-vehicle-id",
        },
      ];

      mockUseVehicleHistory.mockReturnValue({
        history: vehiclesNoVin,
        isLoading: false,
        recordView: vi.fn(),
      });

      render(<ContinueShoppingVdpConnected excludeVin="current-vehicle-id" />);

      expect(mockCarousel).toHaveBeenCalledWith(
        expect.objectContaining({
          recentlyViewed: [vehiclesNoVin[1]],
        })
      );
    });
  });

  describe("empty state", () => {
    it("renders nothing when history is empty and not loading", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(<ContinueShoppingVdpConnected excludeVin="ANY_VIN" />);

      expect(container.innerHTML).toBe("");
      expect(mockCarousel).not.toHaveBeenCalled();
    });

    it("renders nothing when all history items match the excludeVin", () => {
      const [firstVehicle] = mockVehicles;
      if (!firstVehicle) {
        throw new Error("mockVehicles fixture is empty");
      }
      mockUseVehicleHistory.mockReturnValue({
        history: [firstVehicle],
        isLoading: false,
        recordView: vi.fn(),
      });

      const { container } = render(<ContinueShoppingVdpConnected excludeVin="3TMDZ5BN8NM126690" />);

      expect(container.innerHTML).toBe("");
      expect(mockCarousel).not.toHaveBeenCalled();
    });

    it("renders carousel during loading even when arrays are empty", () => {
      mockUseVehicleHistory.mockReturnValue({
        history: [],
        isLoading: true,
        recordView: vi.fn(),
      });

      const { container } = render(
        <ContinueShoppingVdpConnected className="test-wrapper" excludeVin="ANY_VIN" />
      );

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
      expect(mockCarousel).toHaveBeenCalled();
    });
  });
});
