import type { TaxonomySearchResult } from "@features/search/actions/search-by-taxonomy";
import { act } from "@testing-library/react";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockSearchByTaxonomy = vi.fn<(vins: string | string[]) => Promise<TaxonomySearchResult>>();
vi.mock("@features/search/actions/search-by-taxonomy", () => ({
  searchByTaxonomy: (...args: unknown[]) => mockSearchByTaxonomy(...(args as [string])),
}));

const mockUseVehicleHistoryCollection = vi.fn();
vi.mock("@shared/hooks/use-vehicle-history-collection", () => ({
  useVehicleHistoryCollection: () => mockUseVehicleHistoryCollection(),
}));

const mockUseLiveQuery = vi.fn();
vi.mock("@tanstack/react-db", () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}));

vi.mock("@shared/components/inventory-card", () => ({
  LinkInventoryCard: ({ vehicle }: { vehicle: { id: string; title?: string } }) => (
    <div data-testid={`inventory-card-${vehicle.id}`}>{vehicle.title ?? vehicle.id}</div>
  ),
  InventoryCardCarousel: ({ vehicles }: { vehicles: Array<{ id: string }> }) => (
    <div data-testid="carousel">
      {vehicles.map((v) => (
        <div data-testid={`inventory-card-${v.id}`} key={v.id}>
          {v.id}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@shared/components/section-header", () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="section-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock("@ucmp/ui", () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  ),
  CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../search-recommendations-skeleton", () => ({
  SearchRecommendationsSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

// ─── Import under test ──────────────────────────────────────────────────────
import { SearchRecommendationsClient } from "../search-recommendations-client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function setupLoadingState() {
  mockUseVehicleHistoryCollection.mockReturnValue({});
  mockUseLiveQuery.mockReturnValue({ data: [], isLoading: true });
}

function setupNoVins() {
  mockUseVehicleHistoryCollection.mockReturnValue({});
  mockUseLiveQuery.mockReturnValue({ data: [], isLoading: false });
}

function setupWithHistoryVins(vins: Array<{ vin: string; title: string }>) {
  mockUseVehicleHistoryCollection.mockReturnValue({ __type: "history" });
  mockUseLiveQuery.mockReturnValue({ data: vins, isLoading: false });
}

const VALID_VIN = "1HGCM82633A004352";

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SearchRecommendationsClient", () => {
  describe("loading state", () => {
    it("renders skeleton when history collection is loading", () => {
      setupLoadingState();
      render(<SearchRecommendationsClient />);
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders nothing when no VINs are available", () => {
      setupNoVins();
      const { container } = render(<SearchRecommendationsClient />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("with vehicles", () => {
    it("renders section with correct title", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "2024 Toyota RAV4 XLE" }]);

      mockSearchByTaxonomy.mockResolvedValue({
        success: true,
        vehicles: [{ id: "2HGCM82633A004000", title: "Some Car" } as any],
      });

      await act(async () => {
        render(<SearchRecommendationsClient />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      const header = screen.getByTestId("section-header");
      expect(header.textContent).toContain("Because You Viewed");
      expect(header.textContent).toContain(
        "I found a few options you haven't seen yet that I think you'll like"
      );
    });

    it("calls searchByTaxonomy with history VINs", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "Toyota RAV4" }]);

      mockSearchByTaxonomy.mockResolvedValue({
        success: true,
        vehicles: [{ id: "2HGCM82633A004000" } as any],
      });

      await act(async () => {
        render(<SearchRecommendationsClient />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockSearchByTaxonomy).toHaveBeenCalledWith([VALID_VIN], { limit: 20 });
    });

    it("renders nothing when search fails", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "Toyota RAV4" }]);

      mockSearchByTaxonomy.mockResolvedValue({
        success: false,
        vehicles: [],
      });

      const { container } = await act(async () => render(<SearchRecommendationsClient />));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(container.querySelector("[data-testid='carousel']")).not.toBeInTheDocument();
    });

    it("renders nothing when search returns empty vehicles", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "Toyota RAV4" }]);

      mockSearchByTaxonomy.mockResolvedValue({
        success: true,
        vehicles: [],
      });

      const { container } = await act(async () => render(<SearchRecommendationsClient />));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(container.querySelector("[data-testid='carousel']")).not.toBeInTheDocument();
    });

    it("renders nothing when searchByTaxonomy throws", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "Toyota RAV4" }]);

      mockSearchByTaxonomy.mockRejectedValue(new Error("Network error"));

      const { container } = await act(async () => render(<SearchRecommendationsClient />));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(container.querySelector("[data-testid='carousel']")).not.toBeInTheDocument();
    });

    it("sends fewer than 3 VINs when history has fewer entries", async () => {
      setupWithHistoryVins([{ vin: VALID_VIN, title: "Toyota RAV4" }]);

      mockSearchByTaxonomy.mockResolvedValue({
        success: true,
        vehicles: [{ id: "result-1" } as any],
      });

      await act(async () => {
        render(<SearchRecommendationsClient />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      const calledVins = mockSearchByTaxonomy.mock.calls[0]?.[0] as string[];
      expect(calledVins).toHaveLength(1);
    });
  });

  describe("VIN cap", () => {
    it("caps VINs at 3 even when more are available", async () => {
      const manyVins = Array.from({ length: 10 }, (_, i) => ({
        vin: `1HGCM82633A00${String(i).padStart(4, "0")}`,
        title: `Car ${i}`,
      }));

      mockUseVehicleHistoryCollection.mockReturnValue({ __type: "history" });
      mockUseLiveQuery.mockReturnValue({ data: manyVins, isLoading: false });

      mockSearchByTaxonomy.mockResolvedValue({
        success: true,
        vehicles: [{ id: "result-1" } as any],
      });

      await act(async () => {
        render(<SearchRecommendationsClient />);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      const calledVins = mockSearchByTaxonomy.mock.calls[0]?.[0] as string[];
      expect(calledVins).toHaveLength(3);
      // Should be the first 3 (most recent) history VINs
      expect(calledVins).toEqual(manyVins.slice(0, 3).map((v) => v.vin));
    });

    it("does not use watchlist as a VIN source", async () => {
      // Even if the component somehow had access to watchlist data,
      // verify only history VINs are used (empty history = no VINs sent)
      mockUseVehicleHistoryCollection.mockReturnValue({ __type: "history" });
      mockUseLiveQuery.mockReturnValue({ data: [], isLoading: false });

      const { container } = render(<SearchRecommendationsClient />);

      expect(mockSearchByTaxonomy).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });
  });
});
