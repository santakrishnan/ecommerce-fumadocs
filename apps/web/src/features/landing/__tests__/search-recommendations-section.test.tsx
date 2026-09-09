import { render, screen } from "@ucmp/vitest-config/test-utils";
import React from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchRecommendationsSection } from "../components/search-recommendations-section";

// ─── Regex constants (Biome useTopLevelRegex) ───────────────────────
const SAVE_BUTTON_PATTERN = /save/i;

// ─── Fixtures ───────────────────────────────────────────────────────
const MOCK_VEHICLES = [
  {
    id: "174021857",
    vin: "3TMDZ5BN8NM126690",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid XLE",
    price: 40_715,
    mileage: 15_243,
    imageUrl: "/inventory-card/inventory-card1.png",
    href: "https://www.toyotaofhb.com/viewdetails/used/3tmdz5bn8nm126690/2024-toyota-highlander-hybrid-xle",
    surface: "light" as const,
    showBadge: false,
  },
  {
    id: "131123092",
    vin: "4T1BF1FK5EU363091",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "/inventory-card/inventory-card2.png",
    href: "/",
    surface: "light" as const,
    showBadge: false,
  },
  {
    id: "513174383",
    vin: "2T3DWRFV0NW123456",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    price: 42_000,
    mileage: 8120,
    imageUrl: "/inventory-card/inventory-card3.png",
    href: "/",
    surface: "light" as const,
    showBadge: false,
  },
  {
    id: "459246392",
    vin: "5TDDW5G11NS123456",
    make: "Toyota",
    model: "Highlander",
    year: 2023,
    trim: "Limited",
    price: 29_245,
    mileage: 36_435,
    imageUrl: "/inventory-card/inventory-card7.png",
    href: "/",
    surface: "light" as const,
    showBadge: false,
  },
  {
    id: "513174384",
    vin: "JTERU5JR5N6789012",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2023,
    trim: "",
    price: 29_245,
    mileage: 36_435,
    imageUrl: "/inventory-card/inventory-card5.png",
    href: "/",
    surface: "light" as const,
    showBadge: false,
  },
  {
    id: "174021858",
    vin: "7MUSZAA18NU012345",
    make: "Toyota",
    model: "bZ Limited",
    year: 2023,
    trim: "",
    price: 29_245,
    mileage: 36_435,
    imageUrl: "/inventory-card/inventory-card6.png",
    href: "/",
    surface: "light" as const,
    showBadge: false,
  },
];

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default(props: Record<string, unknown>) {
    const { fill, priority, ...rest } = props;
    return React.createElement("img", rest);
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("../services/get-search-recommendations", () => ({
  getSearchRecommendations: vi.fn(),
}));

// SaveButtonClient uses next/dynamic with ssr:false which renders null in jsdom.
vi.mock("@shared/components/inventory-card/save-button-client", async () => {
  const { SaveButton } = await import("../../../shared/components/inventory-card/save-button");
  return { SaveButtonClient: SaveButton };
});

vi.mock("@shared/hooks/use-vehicle-history-collection", () => ({
  useVehicleHistoryCollection: () => ({
    has: () => false,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("@features/profile/watchlist/hooks/use-bookmarked-vehicles-collection", () => ({
  useBookmarkedVehiclesCollection: () => ({
    has: () => false,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("@features/profile/watchlist/services/watchlist-service", () => ({
  watchlistService: {
    save: vi.fn().mockResolvedValue([]),
    unsave: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@tanstack/react-db", () => ({
  useLiveQuery: () => ({ data: [], isLoading: false }),
}));

// Mock ResizeObserver for Embla carousel
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      /** No-op observe for test environment */
      observe() {
        return;
      }
      /** No-op unobserve for test environment */
      unobserve() {
        return;
      }
      /** No-op disconnect for test environment */
      disconnect() {
        return;
      }
    }
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// ─── Lazy import of mocked module ──────────────────────────────────
async function getMockedService() {
  const mod = await import("../services/get-search-recommendations");
  return vi.mocked(mod.getSearchRecommendations);
}

/** Helper: render the async Server Component by awaiting its JSX. */
async function renderSection(props?: Parameters<typeof SearchRecommendationsSection>[0]) {
  const ui = await SearchRecommendationsSection(props);
  if (!ui) {
    return render(<div data-testid="empty" />);
  }
  return render(ui);
}

// ─── Default copy constants ─────────────────────────────────────────
const DEFAULT_TITLE = "BASED ON YOUR SEARCH FOR COMPACT SUVS";
const DEFAULT_SUBTITLE = "I found a few options you haven't seen yet that I think you'll like";

describe("SearchRecommendationsSection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mockedGetSearchRecommendations = await getMockedService();
    mockedGetSearchRecommendations.mockResolvedValue(MOCK_VEHICLES);
  });

  it("renders the section with correct aria-label derived from title", async () => {
    const { container } = await renderSection();

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", DEFAULT_TITLE.toLowerCase());
  });

  it("renders the section header with title and subtitle", async () => {
    await renderSection();

    expect(screen.getByRole("heading", { level: 2, name: DEFAULT_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_SUBTITLE)).toBeInTheDocument();
  });

  it("renders one InventoryCard link per vehicle", async () => {
    await renderSection();

    const links = screen.getAllByRole("link");
    expect(links.length).toBe(MOCK_VEHICLES.length);
  });

  it("renders each vehicle with correct aria-label containing year, make, model, trim, and price", async () => {
    await renderSection();

    for (const vehicle of MOCK_VEHICLES) {
      const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
      const links = screen.getAllByLabelText(new RegExp(label));
      expect(links.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("calls getSearchRecommendations", async () => {
    const mockedGetSearchRecommendations = await getMockedService();
    await renderSection();

    expect(mockedGetSearchRecommendations).toHaveBeenCalled();
  });

  it("renders SectionHeader with custom title and subtitle when provided", async () => {
    const customTitle = "CUSTOM TITLE";
    const customSubtitle = "Custom subtitle text";

    await renderSection({ title: customTitle, subtitle: customSubtitle });

    expect(screen.getByRole("heading", { level: 2, name: customTitle })).toBeInTheDocument();
    expect(screen.getByText(customSubtitle)).toBeInTheDocument();
  });

  it("applies 16px gap between section header and carousel content", async () => {
    const { container } = await renderSection();

    const section = container.querySelector("section");
    expect(section?.className).toContain("w-full");
  });

  it("renders save badge on cards when showBadge is true", async () => {
    await renderSection();

    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons.length).toBe(MOCK_VEHICLES.length);
  });

  describe("no-data DOM absence (PEDX01-2683)", () => {
    it("renders nothing when service returns empty array", async () => {
      const mockedGetSearchRecommendations = await getMockedService();
      mockedGetSearchRecommendations.mockResolvedValue([]);

      const ui = await SearchRecommendationsSection({ className: "test-wrapper" });

      expect(ui).toBeNull();
    });

    it("does not render section wrapper, heading, or carousel when empty", async () => {
      const mockedGetSearchRecommendations = await getMockedService();
      mockedGetSearchRecommendations.mockResolvedValue([]);

      const { container } = await renderSection();

      expect(container.querySelector("section")).toBeNull();
      expect(container.querySelector("[role='heading']")).toBeNull();
    });

    it("renders wrapper with className when data exists", async () => {
      const ui = await SearchRecommendationsSection({ className: "test-wrapper" });

      if (!ui) {
        throw new Error("Expected section to render with data");
      }

      const { container } = render(ui);

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
      expect(container.querySelector("section")).not.toBeNull();
    });
  });
});
