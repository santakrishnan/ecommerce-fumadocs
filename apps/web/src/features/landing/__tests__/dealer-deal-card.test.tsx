/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  dealerDealFullFixture,
  dealerDealMinimalFixture,
} from "../__fixtures__/dealer-deal.fixtures";
import { DealerDealCard } from "../components/dealer-deal/dealer-deal-card";

describe("DealerDealCard", () => {
  describe("rendering with full data", () => {
    it("renders the article with accessible label", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const article = screen.getByRole("article", {
        name: "Deal: 2023 Toyota 4Runner TRD Off Road",
      });
      expect(article).toBeInTheDocument();
    });

    it("renders vehicle metadata in the Figma order", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const price = screen.getByText("$29,900");
      const title = screen.getByRole("heading", { level: 3 });
      const yearMileage = screen.getByText("2023 · 36,435 mi");
      const metadata = price.parentElement?.textContent ?? "";

      expect(price).toHaveClass("body-md", "lg:body-lg");
      expect(yearMileage).toHaveClass("body-md", "lg:body-lg");
      expect(metadata.indexOf("$29,900")).toBeLessThan(metadata.indexOf(title.textContent ?? ""));
      expect(metadata.indexOf(title.textContent ?? "")).toBeLessThan(
        metadata.indexOf("2023 · 36,435 mi")
      );
    });

    it("renders vehicle title (model + trim) in uppercase", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const heading = screen.getByRole("heading", {
        level: 3,
        name: "4Runner TRD Off Road",
      });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass("vehicle-title-lg");
    });

    it("renders urgency message when present", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const urgency = screen.getByText("Act fast, these models usually sell within 5 days");
      expect(urgency).toBeInTheDocument();
      expect(urgency).toHaveClass("h3");
    });

    it("renders financing stats with the correct typography tokens", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const payment = screen.getByText("$408");
      expect(payment).toBeInTheDocument();
      expect(payment).toHaveClass("number-lg");

      const apr = screen.getByText("5.49%");
      expect(apr).toHaveClass("number-lg");

      const term = screen.getByText("60");
      expect(term).toHaveClass("number-lg");

      expect(screen.getByText("Per month")).toHaveClass("body-md");
      expect(screen.getByText("APR")).toHaveClass("body-md");
      expect(screen.getByText("Months")).toHaveClass("body-md");
    });

    it("renders credit score disclaimer", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      expect(screen.getByText("Based on a credit score of 700+")).toBeInTheDocument();
    });

    it("does not render superseded total price or MSRP values", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      expect(screen.queryByText("Total Price")).not.toBeInTheDocument();
      expect(screen.queryByText("$32,490")).not.toBeInTheDocument();
      expect(screen.queryByText("$36,900")).not.toBeInTheDocument();
      expect(screen.queryByText("Term Length")).not.toBeInTheDocument();
    });

    it("renders Buy Now link with correct href", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const buyNow = screen.getByRole("button", { name: "Buy Now" });
      expect(buyNow).toBeInTheDocument();
      expect(buyNow).toHaveAttribute("href", "/vehicle/4runner-trd-off-road-2023/buy");
      expect(buyNow).not.toHaveAttribute("data-surface");
      expect(buyNow).toHaveClass("bg-(--btn-primary-bg)");
    });

    it("renders the vehicle image with correct alt text", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const img = screen.getByRole("img", {
        name: "2023 Toyota 4Runner TRD Off Road on sandy terrain",
      });
      expect(img).toBeInTheDocument();
    });
  });

  describe("rendering with minimal data (no optional fields)", () => {
    it("does not render urgency message when absent", () => {
      render(<DealerDealCard deal={dealerDealMinimalFixture} />);

      expect(
        screen.queryByText("Act fast, these models usually sell within 5 days")
      ).not.toBeInTheDocument();
    });

    it("renders vehicle title without trim when trim is absent", () => {
      render(<DealerDealCard deal={dealerDealMinimalFixture} />);

      const heading = screen.getByRole("heading", {
        level: 3,
        name: "Camry",
      });
      expect(heading).toBeInTheDocument();
    });

    it("does not render MSRP when absent", () => {
      render(<DealerDealCard deal={dealerDealMinimalFixture} />);

      expect(screen.queryByText("$36,900")).not.toBeInTheDocument();
      expect(screen.queryByText("Total Price")).not.toBeInTheDocument();
    });

    it("renders article with correct aria-label without trim", () => {
      render(<DealerDealCard deal={dealerDealMinimalFixture} />);

      const article = screen.getByRole("article", {
        name: "Deal: 2024 Toyota Camry",
      });
      expect(article).toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("applies custom className to the article", () => {
      render(<DealerDealCard className="my-custom-class" deal={dealerDealFullFixture} />);

      const article = screen.getByRole("article");
      expect(article).toHaveClass("my-custom-class");
    });

    it("does not set priority on image by default", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("loading", "lazy");
    });

    it("sets priority on image when priority prop is true", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} priority />);

      const img = screen.getByRole("img");
      // next/image with priority removes lazy loading
      expect(img).not.toHaveAttribute("loading", "lazy");
    });
  });

  describe("semantic structure", () => {
    it("uses a definition list for the three financing stats", () => {
      const { container } = render(<DealerDealCard deal={dealerDealFullFixture} />);

      const dl = container.querySelector("dl");
      expect(dl).toBeInTheDocument();

      const dts = container.querySelectorAll("dt");
      expect(dts).toHaveLength(3);
      expect(Array.from(dts).map((dt) => dt.textContent)).toEqual(["Per month", "APR", "Months"]);

      const dds = container.querySelectorAll("dd");
      expect(dds).toHaveLength(3);
      expect(Array.from(dds).map((dd) => dd.textContent)).toEqual(["$408", "5.49%", "60"]);
    });

    it("renders financing content in the required order", () => {
      const { container } = render(<DealerDealCard deal={dealerDealFullFixture} />);
      const panels = container.querySelectorAll<HTMLElement>("[data-slot='card']");
      const financingPanel = panels.item(1);
      const panelText = financingPanel.textContent ?? "";

      expect(panelText.indexOf("Act fast, these models usually sell within 5 days")).toBeLessThan(
        panelText.indexOf("Per month")
      );
      expect(panelText.indexOf("Per month")).toBeLessThan(
        panelText.indexOf("Based on a credit score of 700+")
      );
      expect(panelText.indexOf("Based on a credit score of 700+")).toBeLessThan(
        panelText.indexOf("Buy Now")
      );
    });

    it("uses responsive image ratios and the financing panel surface", () => {
      const { container } = render(<DealerDealCard deal={dealerDealFullFixture} />);
      const imageContainer = screen.getByRole("img").parentElement;
      const panels = container.querySelectorAll<HTMLElement>("[data-slot='card']");
      const financingPanel = panels.item(1);

      expect(imageContainer).not.toBeNull();
      expect(imageContainer).toHaveClass("aspect-[4/3.5]", "lg:aspect-[5/2]", "xl:aspect-[16/5]");
      expect(imageContainer).not.toHaveClass("lg:min-h-[514px]");
      expect(financingPanel).toHaveClass(
        "bg-card-dark",
        "glass",
        "lg:justify-between",
        "xl:justify-between"
      );
      expect(financingPanel).not.toHaveClass(
        "lg:border",
        "lg:border-white/20",
        "lg:backdrop-blur-md"
      );

      const statBlock = financingPanel.querySelector("dl");
      expect(statBlock).toHaveClass("grid", "grid-cols-3", "gap-4");
    });

    it("marks gradient overlays as aria-hidden", () => {
      const { container } = render(<DealerDealCard deal={dealerDealFullFixture} />);

      const hiddenDivs = container.querySelectorAll("[aria-hidden='true']");
      expect(hiddenDivs.length).toBeGreaterThanOrEqual(2);
    });

    it("keeps the bottom blend on mobile and hides it on desktop", () => {
      const { container } = render(<DealerDealCard deal={dealerDealFullFixture} />);

      const overlays = container.querySelectorAll<HTMLElement>("[aria-hidden='true']");
      expect(overlays).toHaveLength(2);
      expect(overlays.item(0)).not.toHaveClass("lg:hidden");
      expect(overlays.item(1)).toHaveClass("lg:hidden");
    });

    it("applies deal card background color to the article", () => {
      render(<DealerDealCard deal={dealerDealFullFixture} />);

      const article = screen.getByRole("article");
      expect(article).toHaveClass("bg-[oklch(0.78_0.06_70)]");
    });
  });
});
