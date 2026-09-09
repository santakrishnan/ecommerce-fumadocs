/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { LinkTrimCard } from "../link-trim-card";

const XLE_REGEX = /xle/i;
const LE_REGEX = /^le$/i;
const DESCRIPTION_REGEX = /the xle elevates the camry experience/i;
const ELEVATES_REGEX = /elevates/i;
const WIDTH_362_REGEX = /w-\[362px\]/;
const HEIGHT_482_REGEX = /h-\[482px\]/;
const XL_WIDTH_448_REGEX = /xl:w-\[448px\]/;
const XL_HEIGHT_597_REGEX = /xl:h-\[597px\]/;
const ITEMS_CENTER_REGEX = /items-center/;
const JUSTIFY_CENTER_REGEX = /justify-center/;

const fullProps = {
  image: { src: "/images/search/toyota-camry-2024.png", alt: "2025 Camry XLE" },
  title: "XLE",
  year: 2025,
  description:
    "The XLE elevates the Camry experience with leather seating and advanced safety tech.",
  specs: [
    { label: "Wheels", value: '18"' },
    { label: "Display", value: '12.3"' },
    { label: "Interior", value: "Leather" },
    { label: "Average price", value: "$34K" },
  ],
};

const minimalProps = {
  image: { src: "/images/search/toyota-camry-2024.png", alt: "Camry LE" },
  title: "LE",
};

describe("TrimCard", () => {
  describe("rendering with full data", () => {
    it("renders the vehicle image with correct alt text", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      const img = screen.getByAltText("2025 Camry XLE");
      expect(img).toBeInTheDocument();
    });

    it("renders the trim name as an uppercase heading", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      const heading = screen.getByRole("heading", { name: XLE_REGEX });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("uppercase");
    });

    it("renders the model year", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      expect(screen.getByText("2025")).toBeInTheDocument();
    });

    it("renders the AI description", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      expect(screen.getByText(DESCRIPTION_REGEX)).toBeInTheDocument();
    });

    it("renders all spec rows with labels and values", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      expect(screen.getByText("Wheels")).toBeInTheDocument();
      expect(screen.getByText('18"')).toBeInTheDocument();
      expect(screen.getByText("Display")).toBeInTheDocument();
      expect(screen.getByText('12.3"')).toBeInTheDocument();
      expect(screen.getByText("Interior")).toBeInTheDocument();
      expect(screen.getByText("Leather")).toBeInTheDocument();
      expect(screen.getByText("Average price")).toBeInTheDocument();
      expect(screen.getByText("$34K")).toBeInTheDocument();
    });
  });

  describe("rendering with minimal data", () => {
    it("renders the image and trim name", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...minimalProps} />);
      expect(screen.getByAltText("Camry LE")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: LE_REGEX })).toBeInTheDocument();
    });

    it("does not render year when absent", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...minimalProps} />);
      expect(screen.queryByText("2025")).not.toBeInTheDocument();
    });

    it("does not render description when absent", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...minimalProps} />);
      expect(screen.queryByText(ELEVATES_REGEX)).not.toBeInTheDocument();
    });

    it("does not render spec rows when absent", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...minimalProps} />);
      expect(screen.queryByText("Wheels")).not.toBeInTheDocument();
      expect(screen.queryByText("Average price")).not.toBeInTheDocument();
    });
  });

  describe("layout and dimensions", () => {
    it("applies the search card size dimensions by default", () => {
      const { container } = render(
        <LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />
      );
      const card = container.querySelector("[data-slot='card']") as HTMLElement;
      expect(card.className).toMatch(WIDTH_362_REGEX);
      expect(card.className).toMatch(HEIGHT_482_REGEX);
    });

    it("applies responsive xl dimensions", () => {
      const { container } = render(
        <LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />
      );
      const card = container.querySelector("[data-slot='card']") as HTMLElement;
      expect(card.className).toMatch(XL_WIDTH_448_REGEX);
      expect(card.className).toMatch(XL_HEIGHT_597_REGEX);
    });

    it("applies translucent background and rounded corners", () => {
      const { container } = render(
        <LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />
      );
      const card = container.querySelector("[data-slot='card']") as HTMLElement;
      expect(card.className).toContain("bg-white/20");
      expect(card.className).toContain("rounded-2xl");
    });

    it("centers the vehicle image in its container", () => {
      const { container } = render(
        <LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />
      );
      const header = container.querySelector("[data-slot='card-header']");
      expect(header).toBeInTheDocument();
      expect(header?.className).toMatch(ITEMS_CENTER_REGEX);
      expect(header?.className).toMatch(JUSTIFY_CENTER_REGEX);
    });
  });

  describe("badge slot", () => {
    it("renders the badge when provided", () => {
      render(
        <LinkTrimCard
          linkProps={{ href: "/trims/test" }}
          {...fullProps}
          badge={<span data-testid="ai-badge">Best range</span>}
        />
      );
      expect(screen.getByTestId("ai-badge")).toBeInTheDocument();
      expect(screen.getByText("Best range")).toBeInTheDocument();
    });

    it("does not render a badge when not provided", () => {
      render(<LinkTrimCard linkProps={{ href: "/trims/test" }} {...fullProps} />);
      expect(screen.queryByTestId("ai-badge")).not.toBeInTheDocument();
    });
  });
});
