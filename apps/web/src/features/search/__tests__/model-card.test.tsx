/// <reference types="@testing-library/jest-dom" />

import { LinkModelCard } from "@shared/components/model-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  modelCardFullFixture,
  modelCardMinimalFixture,
  modelCardPartialFixture,
} from "../__fixtures__/model-card.fixture";

const HIGHLANDER_REGEX = /highlander/i;
const CAMRY_REGEX = /camry/i;
const MID_SIZE_REGEX = /mid-size/i;
const WIDTH_362_REGEX = /(?<![a-z]:)w-\[362px\]/;
const HEIGHT_482_REGEX = /(?<![a-z]:)h-\[482px\]/;
const XL_WIDTH_448_REGEX = /xl:w-\[448px\]/;
const XL_HEIGHT_597_REGEX = /xl:h-\[597px\]/;
const JUSTIFY_CENTER_REGEX = /justify-center/;

describe("ModelCard", () => {
  const defaultLinkProps = { href: "/models/test" };

  describe("rendering with full data", () => {
    it("renders the vehicle image with correct alt text", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      const img = screen.getByAltText("Highlander");
      expect(img).toBeInTheDocument();
    });

    it("renders the vehicle name as an uppercase heading", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      const heading = screen.getByRole("heading", {
        name: HIGHLANDER_REGEX,
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("uppercase");
    });

    it("renders the model year", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("2024")).toBeInTheDocument();
    });

    it("renders the description when provided", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(
        screen.getByText("A mid-size SUV with three rows and premium comfort.")
      ).toBeInTheDocument();
    });

    it("renders fuel efficiency spec row", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("Fuel efficiency")).toBeInTheDocument();
      expect(screen.getByText("31 MPG combined")).toBeInTheDocument();
    });

    it("renders capacity spec row", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("Capacity")).toBeInTheDocument();
      expect(screen.getByText("8 passengers")).toBeInTheDocument();
    });

    it("renders average price spec row", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("Average price")).toBeInTheDocument();
      expect(screen.getByText("$38,000")).toBeInTheDocument();
    });

    it("renders all color swatches", () => {
      render(<LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("Colors")).toBeInTheDocument();
      expect(screen.getByAltText("Midnight Black")).toBeInTheDocument();
      expect(screen.getByAltText("Wind Chill Pearl")).toBeInTheDocument();
      expect(screen.getByAltText("Blueprint")).toBeInTheDocument();
    });
  });

  describe("rendering with minimal data (no optional fields)", () => {
    it("renders the vehicle image", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByAltText("Camry")).toBeInTheDocument();
    });

    it("renders the vehicle name and year", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByRole("heading", { name: CAMRY_REGEX })).toBeInTheDocument();
      expect(screen.getByText("2025")).toBeInTheDocument();
    });

    it("does not render description when absent", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText(MID_SIZE_REGEX)).not.toBeInTheDocument();
    });

    it("does not render fuel efficiency when absent", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText("Fuel efficiency")).not.toBeInTheDocument();
    });

    it("does not render capacity when absent", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText("Capacity")).not.toBeInTheDocument();
    });

    it("does not render average price when absent", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText("Average price")).not.toBeInTheDocument();
    });

    it("does not render colors when absent", () => {
      render(<LinkModelCard {...modelCardMinimalFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    });
  });

  describe("rendering with partial data", () => {
    it("renders only the provided optional fields", () => {
      render(<LinkModelCard {...modelCardPartialFixture} linkProps={defaultLinkProps} />);
      expect(screen.getByText("Fuel efficiency")).toBeInTheDocument();
      expect(screen.getByText("33 MPG combined")).toBeInTheDocument();
      expect(screen.getByText("Capacity")).toBeInTheDocument();
      expect(screen.getByText("5 passengers")).toBeInTheDocument();
    });

    it("does not render fields that are not provided", () => {
      render(<LinkModelCard {...modelCardPartialFixture} linkProps={defaultLinkProps} />);
      expect(screen.queryByText("Average price")).not.toBeInTheDocument();
      expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    });
  });

  describe("layout and dimensions", () => {
    it("applies correct base card dimensions", () => {
      const { container } = render(
        <LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />
      );
      const card = container.querySelector("[data-slot='card']") as HTMLElement;
      expect(card.className).toMatch(WIDTH_362_REGEX);
      expect(card.className).toMatch(HEIGHT_482_REGEX);
    });

    it("applies responsive xl dimensions", () => {
      const { container } = render(
        <LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />
      );
      const card = container.querySelector("[data-slot='card']") as HTMLElement;
      expect(card.className).toMatch(XL_WIDTH_448_REGEX);
      expect(card.className).toMatch(XL_HEIGHT_597_REGEX);
    });

    it("centers the vehicle image in its container", () => {
      const { container } = render(
        <LinkModelCard {...modelCardFullFixture} linkProps={defaultLinkProps} />
      );
      const header = container.querySelector("[class*='items-center']");
      expect(header).toBeInTheDocument();
      expect(header?.className).toMatch(JUSTIFY_CENTER_REGEX);
    });
  });
});
