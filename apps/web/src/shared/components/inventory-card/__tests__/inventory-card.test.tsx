import {
  mockHighMileageVehicle,
  mockLowMileageVehicle,
  mockVehicle,
} from "@features/landing/__fixtures__/vehicle.fixtures";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { formatMileage, formatPrice } from "utils";
import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "../link-inventory-card";
import { LinkInventoryCard } from "../link-inventory-card";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, className, sizes }: any) => (
    // biome-ignore lint/performance/noImgElement: Test mock requires native img element
    // biome-ignore lint/correctness/useImageSize: Test mock doesn't need explicit dimensions
    <img
      alt={alt}
      className={className}
      data-fill={fill ? "true" : "false"}
      data-sizes={sizes}
      data-testid="vehicle-image"
      src={src}
    />
  ),
}));

// SaveButtonClient uses next/dynamic with ssr:false which renders null in jsdom.
// Replace with the real SaveButton so save-badge tests can find the rendered button.
vi.mock("@shared/components/inventory-card/save-button-client", async () => {
  const { SaveButton } = await import("../save-button");
  return { SaveButtonClient: SaveButton };
});

// Mock the vehicle history collection used by SaveButton to avoid IDB/TanStack DB errors.
vi.mock("@shared/hooks/use-vehicle-history-collection", () => ({
  useVehicleHistoryCollection: () => ({
    has: () => false,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock the bookmarked-vehicles collection used by useBookmarkedVehicle hook.
vi.mock("@features/profile/watchlist/hooks/use-bookmarked-vehicles-collection", () => ({
  useBookmarkedVehiclesCollection: () => ({
    has: () => false,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock the watchlist service to prevent real API calls.
vi.mock("@features/profile/watchlist/services/watchlist-service", () => ({
  watchlistService: {
    save: vi.fn().mockResolvedValue([]),
    unsave: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@tanstack/react-db", () => ({
  eq: (field: unknown, value: unknown) => ({ field, value }),
  useLiveQuery: () => ({ data: [], isLoading: false }),
  createCollection: () => ({
    has: () => false,
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe("InventoryCard", () => {
  describe("Small variant", () => {
    it("renders with correct mobile aspect ratio (178/237)", () => {
      const { container } = render(<LinkInventoryCard size="small" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("aspect-[178/237]");
      expect(wrapper).toHaveClass("w-full");
    });

    it("renders with desktop aspect ratio (220/293)", () => {
      const { container } = render(<LinkInventoryCard size="small" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("lg:aspect-[220/293]");
    });

    it("uses fill for next/image", () => {
      render(<LinkInventoryCard size="small" vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-fill", "true");
    });

    it("defaults to small size when not specified", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("aspect-[178/237]");
    });
  });

  describe("Medium variant", () => {
    it("renders with correct mobile aspect ratio (270/360)", () => {
      const { container } = render(<LinkInventoryCard size="medium" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("aspect-[270/360]");
      expect(wrapper).toHaveClass("w-full");
    });

    it("renders with desktop aspect ratio (334/445)", () => {
      const { container } = render(<LinkInventoryCard size="medium" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("lg:aspect-[334/445]");
    });

    it("uses fill for next/image", () => {
      render(<LinkInventoryCard size="medium" vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-fill", "true");
    });
  });

  describe("Large variant", () => {
    it("renders with correct mobile aspect ratio (362/482)", () => {
      const { container } = render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("aspect-[362/482]");
      expect(wrapper).toHaveClass("w-full");
    });

    it("renders with desktop aspect ratio (448/597)", () => {
      const { container } = render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("lg:aspect-[448/597]");
    });

    it("uses fill for next/image", () => {
      render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-fill", "true");
    });

    it("includes responsive sizes attribute", () => {
      render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-sizes");
    });
  });

  describe("Content rendering", () => {
    it("displays vehicle year", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("displays vehicle model and trim in h3 (uppercase)", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Highlander");
      expect(heading).toHaveTextContent("XLE");
      expect(heading).toHaveClass("vehicle-title-sm");
    });

    it("displays formatted mileage (AC-4)", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const expectedMileage = formatMileage(30_000);
      expect(screen.getByText(expectedMileage)).toBeInTheDocument();
      expect(screen.getByText("30,000 mi")).toBeInTheDocument();
    });

    it("displays formatted price (AC-3)", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const expectedPrice = formatPrice(22_500);
      expect(screen.getByText(expectedPrice)).toBeInTheDocument();
    });

    it("renders content in correct order: Price → Title → Meta", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      const children = contentDiv?.children;
      // First child: price row (div with price)
      expect(children?.[0]?.textContent).toContain(formatPrice(22_500));
      // Second child: h3 (model/trim)
      expect(children?.[1]?.tagName).toBe("H3");
      // Third child: meta row (year • mileage)
      expect(children?.[2]?.textContent).toContain("2024");
      expect(children?.[2]?.textContent).toContain("30,000 mi");
    });
  });

  describe("Accessibility (AC-5)", () => {
    it("has proper aria-label with vehicle info and price", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const link = screen.getByRole("link");
      const expectedLabel = `2024 Toyota Highlander XLE — ${formatPrice(22_500)}`;
      expect(link).toHaveAttribute("aria-label", expectedLabel);
    });

    it("has correct href to vehicle details page", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/");
    });

    it("uses descriptive image alt text", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("alt", "2024 Toyota Highlander XLE");
    });

    it("uses h3 for vehicle model and trim heading", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Highlander");
      expect(heading).toHaveTextContent("XLE");
    });

    it("uses next/image (no bare img tags)", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toBeInTheDocument();
    });
  });

  describe("Styling and tokens", () => {
    it("applies correct border radius and overflow", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("overflow-clip");
    });

    it("applies correct background color token", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("bg-surface-primary");
    });

    it("applies relative positioning to card", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("relative");
    });

    it("content container is absolutely positioned", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveClass("left-4");
      expect(contentDiv).toHaveClass("z-1");
    });

    it("applies correct bottom spacing for small variant", () => {
      const { container } = render(<LinkInventoryCard size="small" vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      expect(contentDiv).toHaveClass("bottom-5");
    });

    it("applies correct bottom spacing for medium variant", () => {
      const { container } = render(<LinkInventoryCard size="medium" vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      expect(contentDiv).toHaveClass("bottom-8");
    });

    it("applies correct bottom spacing for large variant", () => {
      const { container } = render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      expect(contentDiv).toHaveClass("bottom-10");
    });

    it("applies correct typography tokens to vehicle model (small)", () => {
      const { container } = render(<LinkInventoryCard size="small" vehicle={mockVehicle} />);
      const heading = container.querySelector("h3");
      expect(heading).toHaveClass("vehicle-title-sm");
    });

    it("applies correct typography tokens to vehicle model (large)", () => {
      const { container } = render(<LinkInventoryCard size="large" vehicle={mockVehicle} />);
      const heading = container.querySelector("h3");
      expect(heading).toHaveClass("vehicle-title-lg");
    });

    it("applies correct typography tokens to year (in meta row)", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const yearP = screen.getByText("2024");
      expect(yearP).toHaveClass("body-sm");
    });

    it("applies correct typography tokens to price", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const priceText = screen.getByText(formatPrice(22_500));
      expect(priceText).toHaveClass("body-sm");
    });

    it("text overlays inherit color from CardContent via data-surface", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const cardContent = container.querySelector('[data-slot="card-content"]');
      expect(cardContent).toHaveClass("text-text-primary");
    });
  });

  describe("Formatter utilities", () => {
    it("formatPrice returns correct currency format", () => {
      expect(formatPrice(22_500)).toBe("$22,500");
    });

    it("formatMileage returns correct format with mi suffix", () => {
      expect(formatMileage(30_000)).toBe("30,000 mi");
    });

    it("formatMileage handles large numbers", () => {
      expect(formatMileage(mockHighMileageVehicle.mileage)).toBe("150,000 mi");
    });

    it("formatMileage handles small numbers", () => {
      expect(formatMileage(mockLowMileageVehicle.mileage)).toBe("100 mi");
    });

    it("formatPrice handles different amounts", () => {
      expect(formatPrice(45_000)).toBe("$45,000");
      expect(formatPrice(999)).toBe("$999");
    });
  });

  describe("Save badge", () => {
    it("does not render save button when showSaveButton is not set", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).not.toBeInTheDocument();
    });

    it("does not render save button when vehicle.showBadge is false", () => {
      const { container } = render(
        <LinkInventoryCard vehicle={{ ...mockVehicle, showBadge: false }} />
      );
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).not.toBeInTheDocument();
    });

    it("does not render save button when vehicle has no vin", () => {
      const { container } = render(<LinkInventoryCard showSaveButton vehicle={mockVehicle} />);
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).not.toBeInTheDocument();
    });

    it("renders save button when showSaveButton prop is true and vin is present", () => {
      const { container } = render(
        <LinkInventoryCard showSaveButton vehicle={{ ...mockVehicle, vin: "1HGBH41JXMN109186" }} />
      );
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).toBeInTheDocument();
    });

    it("renders save button when vehicle.showBadge is true and vin is present (backward compat)", () => {
      const { container } = render(
        <LinkInventoryCard
          vehicle={{ ...mockVehicle, showBadge: true, vin: "1HGBH41JXMN109186" }}
        />
      );
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).toBeInTheDocument();
    });

    it("showSaveButton prop overrides vehicle.showBadge when vin is present", () => {
      const { container } = render(
        <LinkInventoryCard
          showSaveButton
          vehicle={{ ...mockVehicle, showBadge: false, vin: "1HGBH41JXMN109186" }}
        />
      );
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe("Card badge (CardBadge)", () => {
    const badgeVehicle = {
      ...mockVehicle,
      badge: { label: "Just listed", iconName: "bolt" as const },
    };

    it("renders CardBadge when showBadge is true and badge data is present", () => {
      render(<LinkInventoryCard showBadge vehicle={badgeVehicle} />);
      expect(screen.getByText("Just listed")).toBeInTheDocument();
    });

    it("does not render CardBadge when showBadge is false", () => {
      render(<LinkInventoryCard vehicle={badgeVehicle} />);
      expect(screen.queryByText("Just listed")).not.toBeInTheDocument();
    });

    it("does not render CardBadge when badge data is absent", () => {
      render(<LinkInventoryCard showBadge vehicle={mockVehicle} />);
      expect(screen.queryByText("Just listed")).not.toBeInTheDocument();
    });

    it("renders badge with iconName resolved from icon map", () => {
      const { container } = render(<LinkInventoryCard showBadge vehicle={badgeVehicle} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("badge prop overrides vehicle.badge", () => {
      render(
        <LinkInventoryCard
          badge={{ label: "Price drop", iconName: "dollar" }}
          showBadge
          vehicle={badgeVehicle}
        />
      );
      expect(screen.getByText("Price drop")).toBeInTheDocument();
      expect(screen.queryByText("Just listed")).not.toBeInTheDocument();
    });

    it("renders both CardBadge and SaveButton simultaneously", () => {
      const { container } = render(
        <LinkInventoryCard
          showBadge
          showSaveButton
          vehicle={{ ...badgeVehicle, vin: "1HGBH41JXMN109186" }}
        />
      );
      expect(screen.getByText("Just listed")).toBeInTheDocument();
      const saveButton = container.querySelector('button[aria-label*="Save"]');
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe("Search variant", () => {
    it("renders with correct mobile dimensions (362×482px)", () => {
      const { container } = render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("w-[362px]");
      expect(wrapper).toHaveClass("h-[482px]");
    });

    it("renders with desktop dimensions (448×597px)", () => {
      const { container } = render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const wrapper = container.querySelector('[data-slot="card-root"]');
      expect(wrapper).toHaveClass("xl:w-[448px]");
      expect(wrapper).toHaveClass("xl:h-[597px]");
    });

    it("applies correct bottom spacing", () => {
      const { container } = render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const contentDiv = container.querySelector('[data-slot="card-content"]');
      expect(contentDiv).toHaveClass("bottom-8");
    });

    it("applies body-lg typography for year", () => {
      render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const yearP = screen.getByText("2024");
      expect(yearP).toHaveClass("body-lg");
    });

    it("applies responsive typography for heading", () => {
      const { container } = render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const heading = container.querySelector("h3");
      expect(heading).toHaveClass("h3");
    });

    it("uses fill for next/image", () => {
      render(<LinkInventoryCard size="search" vehicle={mockVehicle} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-fill", "true");
    });
  });

  describe("AI description", () => {
    it("renders aiDescription text when provided", () => {
      render(<LinkInventoryCard aiDescription="Great fuel economy" vehicle={mockVehicle} />);
      expect(screen.getByText("Great fuel economy")).toBeInTheDocument();
    });

    it("does not render aiDescription element when not provided", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const aiLabel = container.querySelector('[data-slot="eyebrow"]');
      expect(aiLabel).not.toBeInTheDocument();
    });

    it("renders the spark icon alongside aiDescription", () => {
      render(<LinkInventoryCard aiDescription="Sporty sedan" vehicle={mockVehicle} />);
      const aiLabel = screen.getByText("Sporty sedan").closest('[data-slot="eyebrow"]');
      const svg = aiLabel?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("applies correct typography to aiDescription", () => {
      render(<LinkInventoryCard aiDescription="Low mileage" vehicle={mockVehicle} />);
      const aiLabel = screen.getByText("Low mileage").closest('[data-slot="eyebrow"]');
      expect(aiLabel).toHaveClass("body-sm");
      expect(aiLabel).toHaveClass("lg:body-md");
      expect(aiLabel).toHaveClass("text-text-primary");
    });

    it("applies margin-top spacing from metadata", () => {
      render(<LinkInventoryCard aiDescription="Test spacing" vehicle={mockVehicle} />);
      const aiLabel = screen.getByText("Test spacing").closest('[data-slot="eyebrow"]');
      expect(aiLabel).toHaveClass("mt-2");
    });

    it("reads aiDescription from vehicle prop when no override provided", () => {
      render(
        <LinkInventoryCard vehicle={{ ...mockVehicle, aiDescription: "From vehicle prop" }} />
      );
      expect(screen.getByText("From vehicle prop")).toBeInTheDocument();
    });

    it("aiDescription prop overrides vehicle.aiDescription", () => {
      render(
        <LinkInventoryCard
          aiDescription="Override description"
          vehicle={{ ...mockVehicle, aiDescription: "Vehicle description" }}
        />
      );
      expect(screen.getByText("Override description")).toBeInTheDocument();
      expect(screen.queryByText("Vehicle description")).not.toBeInTheDocument();
    });

    it("applies text-text-primary to aiDescription regardless of surface", () => {
      const { container } = render(
        <LinkInventoryCard aiDescription="Fuel efficient" surface="light" vehicle={mockVehicle} />
      );
      const aiLabel = container.querySelector('[data-slot="eyebrow"]');
      expect(aiLabel).toHaveClass("text-text-primary");
    });
  });

  describe("href prop", () => {
    it("defaults to / when no href provided", () => {
      render(<LinkInventoryCard vehicle={mockVehicle} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/");
    });

    it("uses provided href for VDP link", () => {
      render(<LinkInventoryCard href="/inventory/veh-001" vehicle={mockVehicle} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/inventory/veh-001");
    });

    it("falls back to vehicle.href when no href prop provided", () => {
      render(<LinkInventoryCard vehicle={{ ...mockVehicle, href: "/inventory/from-vehicle" }} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/inventory/from-vehicle");
    });

    it("href prop overrides vehicle.href", () => {
      render(
        <LinkInventoryCard
          href="/inventory/override"
          vehicle={{ ...mockVehicle, href: "/inventory/from-vehicle" }}
        />
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/inventory/override");
    });
  });

  describe("Sale price with strikethrough", () => {
    const saleVehicle: Vehicle = {
      ...mockVehicle,
      price: 29_245,
      originalPrice: 30_245,
    };

    it("renders originalPrice with line-through when provided (AC-1, AC-2)", () => {
      const { container } = render(<LinkInventoryCard vehicle={saleVehicle} />);
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).toBeInTheDocument();
      expect(originalPriceEl).toHaveTextContent("$30,245");
      expect(originalPriceEl).toHaveClass("line-through");
    });

    it("renders current price at normal weight alongside strikethrough", () => {
      render(<LinkInventoryCard vehicle={saleVehicle} />);
      const currentPrice = screen.getByText("$29,245");
      expect(currentPrice).toHaveClass("body-sm");
      expect(currentPrice).not.toHaveClass("line-through");
    });

    it("renders strikethrough with line-through class (AC-6)", () => {
      const { container } = render(<LinkInventoryCard surface="light" vehicle={saleVehicle} />);
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).toHaveClass("line-through");
    });

    it("renders strikethrough with line-through regardless of surface (AC-6)", () => {
      const { container } = render(<LinkInventoryCard surface="dark" vehicle={saleVehicle} />);
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).toHaveClass("line-through");
    });

    it("does not render originalPrice when not provided (AC-11, no regression)", () => {
      const { container } = render(<LinkInventoryCard vehicle={mockVehicle} />);
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).not.toBeInTheDocument();
    });

    it("does not render originalPrice when it equals current price", () => {
      const { container } = render(
        <LinkInventoryCard vehicle={{ ...mockVehicle, originalPrice: 22_500 }} />
      );
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).not.toBeInTheDocument();
    });

    it("originalPrice prop overrides vehicle.originalPrice", () => {
      const { container } = render(
        <LinkInventoryCard originalPrice={35_000} vehicle={{ ...mockVehicle, price: 30_000 }} />
      );
      const originalPriceEl = container.querySelector('[data-slot="original-price"]');
      expect(originalPriceEl).toHaveTextContent("$35,000");
    });

    it("works at all card sizes (AC-8)", () => {
      for (const size of ["small", "medium", "large", "search"] as const) {
        const { container } = render(<LinkInventoryCard size={size} vehicle={saleVehicle} />);
        const originalPriceEl = container.querySelector('[data-slot="original-price"]');
        expect(originalPriceEl).toBeInTheDocument();
      }
    });
  });

  describe("descriptionReveal prop", () => {
    const vehicleWithDescription = {
      ...mockVehicle,
      aiDescription: "Includes hard-to-find performance packages",
    };

    describe('default / "always" variant', () => {
      it("renders aiDescription without hover-reveal classes on the eyebrow", () => {
        const { container } = render(<LinkInventoryCard vehicle={vehicleWithDescription} />);
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).toBeInTheDocument();
        expect(eyebrow).not.toHaveClass("opacity-0");
      });

      it("does not add translate classes to CardContent", () => {
        const { container } = render(<LinkInventoryCard vehicle={vehicleWithDescription} />);
        const content = container.querySelector('[data-slot="card-content"]');
        expect(content).not.toHaveClass("group-hover/card:-translate-y-6");
      });

      it("does not add brightness classes to the image", () => {
        render(<LinkInventoryCard vehicle={vehicleWithDescription} />);
        const image = screen.getByTestId("vehicle-image");
        expect(image).not.toHaveClass("group-hover/card:brightness-110");
      });
    });

    describe('"hover" variant', () => {
      it("renders aiDescription hidden by default (opacity-0)", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).toBeInTheDocument();
        expect(eyebrow).toHaveClass("opacity-0");
      });

      it("reveals description on hover via group-hover opacity", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).toHaveClass("group-hover/card:opacity-100");
      });

      it("reveals description on keyboard focus via group-focus-within", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).toHaveClass("group-focus-within/card:opacity-100");
      });

      it("slides the content block up on hover (drawer effect)", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const content = container.querySelector('[data-slot="card-content"]');
        expect(content).toHaveClass("group-hover/card:-translate-y-6");
        expect(content).toHaveClass("group-focus-within/card:-translate-y-6");
      });

      it("applies transition on the content block", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const content = container.querySelector('[data-slot="card-content"]');
        expect(content).toHaveClass("transition-transform");
        expect(content).toHaveClass("duration-300");
        expect(content).toHaveClass("ease-out");
      });

      it("applies opacity transition on the eyebrow", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).toHaveClass("transition-opacity");
        expect(eyebrow).toHaveClass("duration-300");
      });

      it("adds brightness hover effect to card image", () => {
        render(<LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />);
        const image = screen.getByTestId("vehicle-image");
        expect(image).toHaveClass("group-hover/card:brightness-110");
        expect(image).toHaveClass("group-focus-within/card:brightness-110");
      });

      it("respects reduced-motion by suppressing slide and transition", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const content = container.querySelector('[data-slot="card-content"]');
        expect(content).toHaveClass("motion-reduce:transform-none");
        expect(content).toHaveClass("motion-reduce:transition-none");
      });

      it("aiDescription text remains in the DOM (accessible to screen readers)", () => {
        render(<LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />);
        expect(screen.getByText("Includes hard-to-find performance packages")).toBeInTheDocument();
      });

      it("does not use display:none — content remains accessible", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={vehicleWithDescription} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).not.toHaveClass("hidden");
        expect(eyebrow).toBeInTheDocument();
      });
    });

    describe("no aiDescription with hover variant", () => {
      it("does not render eyebrow when aiDescription is absent", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={mockVehicle} />
        );
        const eyebrow = container.querySelector('[data-slot="eyebrow"]');
        expect(eyebrow).not.toBeInTheDocument();
      });

      it("does not add slide-up or brightness classes when no description to reveal", () => {
        const { container } = render(
          <LinkInventoryCard descriptionReveal="hover" vehicle={mockVehicle} />
        );
        const content = container.querySelector('[data-slot="card-content"]');
        expect(content).not.toHaveClass("group-hover/card:-translate-y-6");

        const image = container.querySelector('[data-testid="vehicle-image"]');
        expect(image).not.toHaveClass("group-hover/card:brightness-110");
      });
    });
  });
});
