/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import type { TrimVehicle } from "../trim-card-carousel";
import { TrimCardCarousel } from "../trim-card-carousel";

const ENTRY_LEVEL_REGEX = /entry-level camry le/i;
const XLE_ELEVATES_REGEX = /xle elevates/i;
const TOP_OF_LINE_REGEX = /top-of-the-line limited/i;
const WIDTH_362_REGEX = /w-\[362px\]/;
const HEIGHT_482_REGEX = /h-\[482px\]/;

const MOCK_TRIM_VEHICLES: TrimVehicle[] = [
  {
    id: "camry-le-2025",
    title: "LE",
    imageUrl: "/images/search/toyota-camry-2024.png",
    description:
      "The entry-level Camry LE offers exceptional value with a standard hybrid powertrain, delivering up to 51 MPG combined with no compromise on comfort.",
    specs: [
      { label: "Wheels", value: '17"' },
      { label: "Display", value: '8"' },
      { label: "Interior", value: "Fabric" },
      { label: "Average price", value: "$28K" },
    ],
  },
  {
    id: "camry-xle-2025",
    title: "XLE",
    year: 2025,
    imageUrl: "/images/search/toyota-camry-2024.png",
    description:
      "The XLE elevates the Camry experience with leather seating, a larger touchscreen, and advanced safety tech — the most popular trim for good reason.",
    specs: [
      { label: "Wheels", value: '18"' },
      { label: "Display", value: '12.3"' },
      { label: "Interior", value: "Leather" },
      { label: "Average price", value: "$34K" },
    ],
  },
  {
    id: "camry-limited-2025",
    title: "Limited",
    year: 2025,
    imageUrl: "/images/search/toyota-camry-2024.png",
    description:
      "The top-of-the-line Limited trims every corner — panoramic roof, JBL audio, and a head-up display round out the most luxurious Camry ever made.",
    specs: [
      { label: "Wheels", value: '18" Machined' },
      { label: "Display", value: '12.3"' },
      { label: "Interior", value: "Premium Leather" },
      { label: "Average price", value: "$39K" },
    ],
  },
];

describe("TrimCardCarousel", () => {
  it("renders a carousel region", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("renders one slide per trim vehicle", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    const slides = screen.getAllByRole("group");
    expect(slides).toHaveLength(MOCK_TRIM_VEHICLES.length);
  });

  it("renders trim names as headings", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    const headings = screen.getAllByRole("heading");
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain("LE");
    expect(headingTexts).toContain("XLE");
    expect(headingTexts).toContain("Limited");
  });

  it("renders vehicle images with alt text for each trim", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    expect(screen.getByAltText("LE")).toBeInTheDocument();
    expect(screen.getByAltText("2025 XLE")).toBeInTheDocument();
    expect(screen.getByAltText("2025 Limited")).toBeInTheDocument();
  });

  it("renders spec rows for each card", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    expect(screen.getAllByText("Wheels")).toHaveLength(3);
    expect(screen.getAllByText("Average price")).toHaveLength(3);
  });

  it("renders descriptions for trims that have them", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    expect(screen.getByText(ENTRY_LEVEL_REGEX)).toBeInTheDocument();
    expect(screen.getByText(XLE_ELEVATES_REGEX)).toBeInTheDocument();
    expect(screen.getByText(TOP_OF_LINE_REGEX)).toBeInTheDocument();
  });

  it("renders an empty carousel track when vehicles array is empty", () => {
    render(<TrimCardCarousel vehicles={[]} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryAllByRole("group")).toHaveLength(0);
  });

  it("renders year when provided on a vehicle", () => {
    render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    expect(screen.getAllByText("2025")).toHaveLength(2);
  });

  it("applies the search card size by default", () => {
    const { container } = render(<TrimCardCarousel vehicles={MOCK_TRIM_VEHICLES} />);
    const cards = container.querySelectorAll("[data-slot='card']");
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.className).toMatch(WIDTH_362_REGEX);
      expect(card.className).toMatch(HEIGHT_482_REGEX);
    }
  });
});
