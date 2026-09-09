/// <reference types="@testing-library/jest-dom" />

import { render, screen, within } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { BUY_WITH_CONFIDENCE_FIXTURE } from "../__fixtures__/buy-with-confidence.fixture";
import { BuyWithConfidence } from "../components/buy-with-confidence";

describe("BuyWithConfidence", () => {
  describe("rendering with full data", () => {
    it("renders the section heading as an h2", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const heading = screen.getByRole("heading", {
        level: 2,
        name: "Buy with no hidden surprises",
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("h3");
      expect(heading).toHaveClass("text-text-primary");
    });

    it("renders the lifestyle image with the provided alt text", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const img = screen.getByRole("img", {
        name: BUY_WITH_CONFIDENCE_FIXTURE.image.alt,
      });
      expect(img).toBeInTheDocument();
    });

    it("exposes the section via aria-labelledby pointing at the heading", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const heading = screen.getByRole("heading", { level: 2 });
      const region = screen.getByRole("region", { name: heading.textContent ?? "" });
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute("aria-labelledby", heading.id);
    });

    it("renders all benefits in a real list", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const list = screen.getByRole("list");
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(BUY_WITH_CONFIDENCE_FIXTURE.benefits.length);
    });

    it("renders each benefit's title and description", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      for (const benefit of BUY_WITH_CONFIDENCE_FIXTURE.benefits) {
        expect(screen.getByText(benefit.title)).toBeInTheDocument();
        expect(screen.getByText(benefit.description)).toBeInTheDocument();
      }
    });
  });

  describe("data-driven rendering", () => {
    it("renders N items for arbitrary benefit counts", () => {
      const data = {
        ...BUY_WITH_CONFIDENCE_FIXTURE,
        benefits: [
          { id: "a", title: "Alpha", description: "First benefit" },
          { id: "b", title: "Beta", description: "Second benefit" },
        ],
      };
      render(<BuyWithConfidence data={data} />);

      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });

    it("uses the heading text passed via props", () => {
      const data = { ...BUY_WITH_CONFIDENCE_FIXTURE, heading: "Custom heading" };
      render(<BuyWithConfidence data={data} />);

      expect(screen.getByRole("heading", { level: 2, name: "Custom heading" })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("applies the dark surface token so child text adapts to light", () => {
      const { container } = render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const region = container.querySelector('[data-surface="dark"]');
      expect(region).toBeInTheDocument();
    });

    it("marks the check icons as decorative", () => {
      const { container } = render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const icons = container.querySelectorAll("svg[aria-hidden='true']");
      expect(icons.length).toBeGreaterThanOrEqual(BUY_WITH_CONFIDENCE_FIXTURE.benefits.length);
    });
  });

  describe("props", () => {
    it("applies a custom className to the outer container", () => {
      render(<BuyWithConfidence className="my-custom-class" data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      expect(screen.getByRole("region")).toHaveClass("my-custom-class");
    });

    it("does not lazy-load the image", () => {
      render(<BuyWithConfidence data={BUY_WITH_CONFIDENCE_FIXTURE} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("loading", "eager");
    });
  });
});
