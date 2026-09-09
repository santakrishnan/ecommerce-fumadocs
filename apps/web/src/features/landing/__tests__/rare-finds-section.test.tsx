/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { IconBinocular } from "@/icons";
import { RareFindsSection } from "../components/rare-finds/rare-finds-section";
import { RareFindsSkeleton } from "../components/rare-finds/rare-finds-skeleton";
import { RARE_FINDS_COPY } from "../data/rare-finds-copy";
import { RARE_FINDS_VEHICLES } from "../data/rare-finds-vehicles";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: () => <div data-testid="next-image" />,
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

interface RenderRareFindsSectionOptions {
  showSaveIcon?: boolean;
  vehicles?: typeof RARE_FINDS_VEHICLES;
}

async function renderRareFindsSection({
  vehicles = RARE_FINDS_VEHICLES.slice(0, 3),
  showSaveIcon = false,
}: RenderRareFindsSectionOptions = {}) {
  const ui = await RareFindsSection({
    rareFindsPromise: Promise.resolve(vehicles),
    showSaveIcon,
  });

  if (!ui) {
    return render(<div data-testid="null-render" />);
  }

  return render(ui);
}

describe("RareFindsSection", () => {
  it("renders the section header copy", async () => {
    await renderRareFindsSection();

    expect(
      screen.getByRole("heading", { level: 2, name: RARE_FINDS_COPY.title })
    ).toBeInTheDocument();
    expect(screen.getByText(RARE_FINDS_COPY.subtitle)).toBeInTheDocument();
  });

  it("applies XL typography to the card titles", async () => {
    const { container } = await renderRareFindsSection();

    const heading = container.querySelector("h3");
    expect(heading).toHaveClass("vehicle-title-lg", "lg:vehicle-title-md", "xl:vehicle-title-lg");
  });

  it("uses a section landmark labeled 'Rare finds'", async () => {
    await renderRareFindsSection();

    expect(screen.getByRole("region", { name: RARE_FINDS_COPY.title })).toBeInTheDocument();
  });

  it("renders one inventory link per vehicle", async () => {
    const vehicles = RARE_FINDS_VEHICLES.slice(0, 3);
    await renderRareFindsSection({ vehicles });

    expect(screen.getAllByRole("link")).toHaveLength(vehicles.length);
  });

  it("returns null when no vehicles are available", async () => {
    await renderRareFindsSection({ vehicles: [] });

    expect(screen.getByTestId("null-render")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("hides save icons when showSaveIcon is false", async () => {
    const { container } = await renderRareFindsSection({ showSaveIcon: false });

    expect(container.querySelectorAll('button[aria-label^="Save "]')).toHaveLength(0);
  });

  it("shows save icons when showSaveIcon is true", async () => {
    const vehicles = RARE_FINDS_VEHICLES.slice(0, 3);
    const { container } = await renderRareFindsSection({ showSaveIcon: true, vehicles });

    expect(container.querySelectorAll('button[aria-label^="Save "]')).toHaveLength(vehicles.length);
  });
});

describe("RareFindsSkeleton", () => {
  it("renders a loading section with matching copy", () => {
    render(
      <RareFindsSkeleton
        icon={<IconBinocular className="size-4" />}
        sectionLabel="Rare finds loading"
        subtitle={RARE_FINDS_COPY.subtitle}
        title={RARE_FINDS_COPY.title}
      />
    );
    expect(screen.getByRole("status", { name: "Rare finds loading" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: RARE_FINDS_COPY.title })
    ).toBeInTheDocument();
    expect(screen.getByText(RARE_FINDS_COPY.subtitle)).toBeInTheDocument();
  });
});
