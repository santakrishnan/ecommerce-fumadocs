import { render, screen } from "@ucmp/vitest-config/test-utils";
import React from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SimilarVehicles } from "../similar-vehicles";

// ─── Regex constants (Biome useTopLevelRegex) ───────────────────────
const HEADING_PATTERN = /similar vehicles available now/i;

// ─── Fixtures ───────────────────────────────────────────────────────
const MOCK_VEHICLES = [
  {
    id: "3TMDZ5BN8NM126690",
    vin: "3TMDZ5BN8NM126690",
    make: "Toyota",
    model: "Highlander",
    year: 2024,
    trim: "Hybrid XLE",
    price: 40_715,
    mileage: 15_243,
    imageUrl: "/inventory-card/inventory-card1.png",
    href: "/used-cars/details/toyota/highlander/hybrid-xle/2024/3TMDZ5BN8NM126690",
    surface: "light" as const,
  },
  {
    id: "4T1BF1FK5EU363091",
    vin: "4T1BF1FK5EU363091",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    trim: "SE",
    price: 28_500,
    mileage: 22_500,
    imageUrl: "/inventory-card/inventory-card2.png",
    href: "/used-cars/details/toyota/camry/se/2023/4T1BF1FK5EU363091",
    surface: "light" as const,
  },
  {
    id: "2T3DWRFV0NW123456",
    vin: "2T3DWRFV0NW123456",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Prime",
    price: 42_000,
    mileage: 8120,
    imageUrl: "/inventory-card/inventory-card3.png",
    href: "/used-cars/details/toyota/rav4/prime/2024/2T3DWRFV0NW123456",
    surface: "light" as const,
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

vi.mock("@features/search/actions/search-by-taxonomy", () => ({
  searchByTaxonomy: vi.fn(),
}));

// SaveButtonClient uses next/dynamic with ssr:false which renders null in jsdom.
vi.mock("@shared/components/inventory-card/save-button-client", async () => {
  const { SaveButton } = await import(
    "../../../../../shared/components/inventory-card/save-button"
  );
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
      observe() {
        return;
      }
      unobserve() {
        return;
      }
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
async function getMockedAction() {
  const mod = await import("@features/search/actions/search-by-taxonomy");
  return vi.mocked(mod.searchByTaxonomy);
}

/** Helper: render the async Server Component by awaiting its JSX. */
async function renderComponent(vin: string) {
  const ui = await SimilarVehicles({ vin });
  if (!ui) {
    return render(<div data-testid="empty" />);
  }
  return render(ui);
}

// ─── Tests ──────────────────────────────────────────────────────────
describe("SimilarVehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section with vehicle cards when taxonomy search succeeds", async () => {
    const mock = await getMockedAction();
    mock.mockResolvedValue({ success: true, vehicles: MOCK_VEHICLES });

    const { container } = await renderComponent("5TDDW5G11NS999999");

    expect(screen.getByRole("heading", { name: HEADING_PATTERN })).toBeInTheDocument();
    expect(container.querySelector('[data-section="similar-vehicles"]')).toBeInTheDocument();
  });

  it("renders nothing when taxonomy search returns no vehicles", async () => {
    const mock = await getMockedAction();
    mock.mockResolvedValue({ success: true, vehicles: [] });

    await renderComponent("5TDDW5G11NS999999");

    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });

  it("renders nothing when taxonomy search fails", async () => {
    const mock = await getMockedAction();
    mock.mockResolvedValue({ success: false, vehicles: [] });

    await renderComponent("5TDDW5G11NS999999");

    expect(screen.getByTestId("empty")).toBeInTheDocument();
  });

  it("passes the vin and limit to searchByTaxonomy", async () => {
    const mock = await getMockedAction();
    mock.mockResolvedValue({ success: true, vehicles: MOCK_VEHICLES });

    await renderComponent("3TMDZ5BN8NM126690");

    expect(mock).toHaveBeenCalledWith("3TMDZ5BN8NM126690", { limit: 3 });
  });
});
