import { locationCookieNames } from "@config/cookies";
import type { Vehicle } from "@shared/components/inventory-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturedVehiclesSection } from "../components/featured-vehicles-section";
import { getFeaturedVehicles } from "../services/inventory-vehicles-service";

interface MockInventoryCarouselProps {
  size?: "small" | "medium" | "large";
  vehicles: Array<{ id: string }>;
}

const mockInventoryCarousel = vi.fn(({ size = "small", vehicles }: MockInventoryCarouselProps) => (
  <div data-size={size} data-testid="inventory-carousel" data-vehicle-count={vehicles.length} />
));

vi.mock("@shared/components/inventory-card", () => ({
  InventoryCardCarousel: (props: MockInventoryCarouselProps) => mockInventoryCarousel(props),
}));

vi.mock("../services/inventory-vehicles-service", () => ({
  getFeaturedVehicles: vi.fn(),
}));

vi.mock("server-only", () => ({}));

// Mutable cookie jar — tests set entries to simulate location cookies.
const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  })),
}));

vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: vi.fn(async () => ({ visitorId: null, sessionId: null })),
}));

const mockedGetFeaturedVehicles = vi.mocked(getFeaturedVehicles);

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "VIN1",
    vin: "VIN1",
    make: "Toyota",
    model: "Camry",
    year: 2024,
    trim: "SE",
    price: 25_000,
    mileage: 10_000,
    imageUrl: "/img.png",
    href: "/",
  },
  {
    id: "VIN2",
    vin: "VIN2",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "XLE",
    price: 32_000,
    mileage: 5000,
    imageUrl: "/img2.png",
    href: "/",
  },
];

const DEFAULT_TITLE = "NEW TODAY";
const DEFAULT_SUBTITLE = "Here are the latest listings I've found in the last 24 hours";

async function renderSection(props?: Parameters<typeof FeaturedVehiclesSection>[0]) {
  const ui = await FeaturedVehiclesSection(props);
  if (!ui) {
    return render(<div data-testid="null-render" />);
  }
  return render(ui);
}

describe("FeaturedVehiclesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
  });

  it("falls back to default ZIP when no cookie is set (cold start)", async () => {
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);

    await renderSection();

    expect(mockedGetFeaturedVehicles).toHaveBeenCalledWith(
      expect.objectContaining({ zipCode: "90210" })
    );
  });

  it("returns null when the vehicle service throws", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockRejectedValue(new Error("boom"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await renderSection();

    expect(screen.getByTestId("null-render")).toBeInTheDocument();
    warnSpy.mockRestore();
  });

  it("returns null when the vehicle list is empty", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockResolvedValue([]);

    await renderSection();

    expect(screen.getByTestId("null-render")).toBeInTheDocument();
  });

  it("renders the section header with default title and subtitle", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);

    await renderSection();

    expect(screen.getByRole("heading", { level: 2, name: DEFAULT_TITLE })).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_SUBTITLE)).toBeInTheDocument();
  });

  it("renders a section linked to the default heading id", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);
    const { container } = await renderSection();

    const section = container.querySelector("section");
    const heading = screen.getByRole("heading", { level: 2, name: DEFAULT_TITLE });

    expect(section).toHaveAttribute("aria-labelledby", "featured-vehicles-heading");
    expect(heading).toHaveAttribute("id", "featured-vehicles-heading");
  });

  it("renders the inventory carousel with the small card size", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);

    await renderSection();

    expect(screen.getByTestId("inventory-carousel")).toHaveAttribute("data-size", "small");
    expect(screen.getByTestId("inventory-carousel")).toHaveAttribute("data-vehicle-count", "2");
  });

  it("passes ZIP, geo, and identity to getFeaturedVehicles", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    cookieJar.set(locationCookieNames.GEO, "34.071,-118.031");
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);

    await renderSection();

    expect(mockedGetFeaturedVehicles).toHaveBeenCalledWith({
      zipCode: "91731",
      latitude: 34.071,
      longitude: -118.031,
      visitorId: null,
      sessionId: null,
    });
  });

  it("renders custom heading copy and heading id when provided", async () => {
    cookieJar.set(locationCookieNames.ZIP, "91731");
    mockedGetFeaturedVehicles.mockResolvedValue(MOCK_VEHICLES);
    const customTitle = "FRESH ARRIVALS";
    const customSubtitle = "Inventory added in the last day";
    const customHeadingId = "fresh-arrivals-heading";
    const { container } = await renderSection({
      headingId: customHeadingId,
      subtitle: customSubtitle,
      title: customTitle,
    });

    const section = container.querySelector("section");
    const heading = screen.getByRole("heading", { level: 2, name: customTitle });

    expect(section).toHaveAttribute("aria-labelledby", customHeadingId);
    expect(heading).toHaveAttribute("id", customHeadingId);
    expect(screen.getByText(customSubtitle)).toBeInTheDocument();
  });
});
