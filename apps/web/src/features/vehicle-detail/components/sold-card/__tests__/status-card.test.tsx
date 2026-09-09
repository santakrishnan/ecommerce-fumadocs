import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  SOLD_DATE_FIXTURE,
  SOLD_DEALER_FIXTURE,
  SOLD_VEHICLE_FIXTURE,
} from "../__fixtures__/status-card.fixture";
import { buildSimilarSearchHref } from "../build-similar-search-href";
import { StatusCard } from "../status-card";
import type { StatusCardProps } from "../status-card.types";

vi.mock("../../status-card-sticky-cta", () => ({
  StatusCardStickyCta: ({ ariaLabel, searchHref }: { ariaLabel: string; searchHref: string }) => (
    // biome-ignore lint/a11y/useSemanticElements: test stub mirrors the real CTA surface
    <a aria-label={ariaLabel} href={searchHref} role="button">
      Search similar to this
    </a>
  ),
}));

const VEHICLE_SOLD_BADGE_PATTERN = /vehicle sold/i;
const VEHICLE_NOT_FOUND_BADGE_PATTERN = /vehicle not found/i;
const HAS_SOLD_PATTERN = /has sold\./;
const NOT_FOUND_HEADING_PATTERN = /this 2023 highlander hybrid limited is not found\./i;
const SOLD_ON_PATTERN = /sold on/i;
const SEARCH_SIMILAR_PATTERN = /search for vehicles similar to this/i;
const DEALER_NAME_PATTERN = /Toyota of Bay Ridge/;
const SOLD_DATE_DISPLAY_PATTERN = /March 24, 2026/;
const DOUBLE_SPACE_PATTERN = / {2}/;

const BASE_PROPS: StatusCardProps = {
  vehicle: SOLD_VEHICLE_FIXTURE,
  dealer: SOLD_DEALER_FIXTURE,
  soldDate: SOLD_DATE_FIXTURE,
};

describe("StatusCard", () => {
  describe("AC1: Badge, headline, sold metadata", () => {
    it("renders the 'Vehicle sold' badge", () => {
      render(<StatusCard {...BASE_PROPS} />);
      expect(screen.getByText(VEHICLE_SOLD_BADGE_PATTERN)).toBeInTheDocument();
    });

    it("renders the headline with year, model, and trim", () => {
      render(<StatusCard {...BASE_PROPS} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("This 2023 Highlander Hybrid Limited has sold.");
    });

    it("renders the sold date and dealer name", () => {
      render(<StatusCard {...BASE_PROPS} />);
      expect(screen.getByText(SOLD_ON_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(DEALER_NAME_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(SOLD_DATE_DISPLAY_PATTERN)).toBeInTheDocument();
    });

    it("handles missing trim gracefully (no double spaces)", () => {
      render(<StatusCard {...BASE_PROPS} vehicle={{ ...SOLD_VEHICLE_FIXTURE, trim: undefined }} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("This 2023 Highlander Hybrid has sold.");
      expect(heading.textContent).not.toMatch(DOUBLE_SPACE_PATTERN);
    });

    it("handles empty string trim gracefully", () => {
      render(<StatusCard {...BASE_PROPS} vehicle={{ ...SOLD_VEHICLE_FIXTURE, trim: "  " }} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("This 2023 Highlander Hybrid has sold.");
    });

    it("renders not-found copy with the sold-card structure intact", () => {
      render(<StatusCard variant="not-found" vehicle={SOLD_VEHICLE_FIXTURE} />);
      expect(screen.getByText(VEHICLE_NOT_FOUND_BADGE_PATTERN)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        NOT_FOUND_HEADING_PATTERN
      );
      expect(screen.queryByText(SOLD_ON_PATTERN)).not.toBeInTheDocument();
    });
  });

  describe("AC2: CTA link with centralized href", () => {
    it("renders 'Search similar to this' as a link", () => {
      render(<StatusCard {...BASE_PROPS} />);
      const cta = screen.getByRole("button", { name: SEARCH_SIMILAR_PATTERN });
      expect(cta.tagName).toBe("A");
    });

    it("CTA href is built by buildSimilarSearchHref (centralized)", () => {
      render(<StatusCard {...BASE_PROPS} />);
      const cta = screen.getByRole("button", { name: SEARCH_SIMILAR_PATTERN });
      const expectedHref = buildSimilarSearchHref(SOLD_VEHICLE_FIXTURE);
      expect(cta).toHaveAttribute("href", expectedHref);
    });

    it("search href includes make, model, trim, bodyStyle, and year range", () => {
      const href = buildSimilarSearchHref(SOLD_VEHICLE_FIXTURE);
      expect(href).toContain("make=Toyota");
      expect(href).toContain("model=Highlander+Hybrid");
      expect(href).toContain("trim=Limited");
      expect(href).toContain("bodyStyle=SUV");
      expect(href).toContain("yearMin=2021");
      expect(href).toContain("yearMax=2025");
      expect(href).toContain("year=2021-2025");
    });

    it("search href omits trim when not provided", () => {
      const href = buildSimilarSearchHref({ ...SOLD_VEHICLE_FIXTURE, trim: undefined });
      expect(href).not.toContain("trim=");
    });

    it("search href omits bodyStyle when not provided", () => {
      const href = buildSimilarSearchHref({ ...SOLD_VEHICLE_FIXTURE, bodyStyle: undefined });
      expect(href).not.toContain("bodyStyle=");
    });
  });

  describe("AC3: Surface theming", () => {
    it("defaults to dark surface", () => {
      render(<StatusCard {...BASE_PROPS} />);
      expect(screen.getByTestId("sold-card")).toHaveAttribute("data-surface", "dark");
    });
  });

  describe("AC5: Accessibility", () => {
    it("headline is an h2 (readable structure)", () => {
      render(<StatusCard {...BASE_PROPS} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent(HAS_SOLD_PATTERN);
    });

    it("CTA has an accurate accessible name including vehicle details", () => {
      render(<StatusCard {...BASE_PROPS} />);
      const cta = screen.getByRole("button", { name: SEARCH_SIMILAR_PATTERN });
      expect(cta).toHaveAttribute(
        "aria-label",
        "Search for vehicles similar to this 2023 Highlander Hybrid Limited"
      );
    });

    it("CTA accessible name omits trim when not provided", () => {
      render(<StatusCard {...BASE_PROPS} vehicle={{ ...SOLD_VEHICLE_FIXTURE, trim: undefined }} />);
      const cta = screen.getByRole("button", { name: SEARCH_SIMILAR_PATTERN });
      expect(cta).toHaveAttribute(
        "aria-label",
        "Search for vehicles similar to this 2023 Highlander Hybrid"
      );
    });
  });

  describe("Date normalization", () => {
    it("normalizes date-only ISO string to avoid UTC shift", () => {
      render(<StatusCard {...BASE_PROPS} soldDate="2026-03-24" />);
      expect(screen.getByText(SOLD_DATE_DISPLAY_PATTERN)).toBeInTheDocument();
    });

    it("handles full ISO datetime string", () => {
      render(<StatusCard {...BASE_PROPS} soldDate="2026-03-24T10:30:00Z" />);
      expect(screen.getByText(SOLD_DATE_DISPLAY_PATTERN)).toBeInTheDocument();
    });

    it("handles Date object", () => {
      render(<StatusCard {...BASE_PROPS} soldDate={new Date(2026, 2, 24)} />);
      expect(screen.getByText(SOLD_DATE_DISPLAY_PATTERN)).toBeInTheDocument();
    });
  });
});
