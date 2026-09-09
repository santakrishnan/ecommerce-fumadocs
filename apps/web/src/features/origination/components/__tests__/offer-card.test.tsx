/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import { OFFER_CARD_FIXTURE } from "../__fixtures__/offer-card.fixture";
import { OFFER_CARD_DEFAULT_CTA_LABEL, OfferCard, type OfferCardProps } from "../offer-card";

function renderOfferCard(props: Partial<OfferCardProps> = {}) {
  return render(<OfferCard {...OFFER_CARD_FIXTURE} {...props} />);
}

describe("OfferCard", () => {
  describe("variation", () => {
    it("renders the default variation by default", () => {
      renderOfferCard();

      expect(
        screen.getByRole("heading", { level: 3, name: OFFER_CARD_FIXTURE.header })
      ).toHaveClass("subhead-lg");
      expect(screen.getByText(OFFER_CARD_FIXTURE.supplementalText)).toHaveClass("body-lg");
    });

    it("omits supplemental text in the minimized variation", () => {
      renderOfferCard({ minimized: true });

      expect(
        screen.getByRole("heading", { level: 3, name: OFFER_CARD_FIXTURE.header })
      ).toHaveClass("subhead-sm");
      expect(screen.queryByText(OFFER_CARD_FIXTURE.supplementalText)).not.toBeInTheDocument();
    });
  });

  describe("shared structure", () => {
    it("uses the same figures grid and separator in both variations", () => {
      for (const minimized of [false, true]) {
        const { container, unmount } = renderOfferCard({ minimized });
        const figures = container.querySelector("dl");

        expect(figures).toHaveAttribute("aria-label", "Financing details");
        expect(figures).toHaveClass("grid", "grid-cols-3", "gap-4");
        expect(figures?.children).toHaveLength(3);

        for (const column of Array.from(figures?.children ?? [])) {
          expect(column).toHaveClass("flex", "min-w-0", "flex-col-reverse", "gap-2");
        }

        expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
        expect(container.querySelectorAll('[data-slot="card-content"]')).toHaveLength(2);
        expect(screen.getByRole("button")).toHaveClass("w-full");

        unmount();
      }
    });

    it("keeps the CTA copy identical across variations", () => {
      const defaultRender = renderOfferCard({ ctaLabel: "Review this offer" });
      const defaultButton = screen.getByRole("button");
      expect(defaultButton).toHaveTextContent("Review this offer");
      defaultRender.unmount();

      renderOfferCard({ ctaLabel: "Review this offer", minimized: true });
      expect(screen.getByRole("button")).toHaveTextContent("Review this offer");
    });
  });

  describe("default variation", () => {
    it("renders default typography, primary CTA, and breakdown rows", () => {
      const { container } = renderOfferCard();
      const figureValues = container.querySelectorAll("dd");

      expect(figureValues).toHaveLength(3);
      for (const figureValue of figureValues) {
        expect(figureValue).toHaveClass("number-lg", "lg:number-xl");
      }

      expect(screen.getByRole("button")).toHaveClass("bg-(--btn-primary-bg)");

      const rows = container.querySelectorAll(".items-baseline.justify-between");
      expect(rows).toHaveLength(3);
      expect(screen.getByText("Estimated Trade-In Value")).toHaveClass("body-md");
      expect(screen.getByText("$21,800")).toHaveClass("subhead-sm");
      expect(screen.getByText("Down Payment")).toHaveClass("body-md");
      expect(screen.getByText("$3,500")).toHaveClass("subhead-sm");
      expect(screen.getByText("Total Financed")).toHaveClass("body-md");
      expect(screen.getByText("$14,399")).toHaveClass("subhead-sm");
    });
  });

  describe("minimized variation", () => {
    it("renders compact typography, tertiary CTA, and joined breakdown", () => {
      const { container } = renderOfferCard({ minimized: true });
      const figureValues = container.querySelectorAll("dd");

      expect(figureValues).toHaveLength(3);
      for (const figureValue of figureValues) {
        expect(figureValue).toHaveClass("number-lg");
        expect(figureValue).not.toHaveClass("lg:number-xl");
      }

      expect(screen.getByRole("button")).toHaveClass("border-(--btn-tertiary-border)");

      const breakdown = container.querySelectorAll('[data-slot="card-content"]').item(1);
      const summary = breakdown.querySelector("p");
      expect(summary).toHaveClass("body-md");
      expect(summary).toHaveTextContent(
        "$21,800 est. trade-in · $3,500 down payment · Total financed $14,399"
      );
      expect(breakdown.querySelectorAll("p")).toHaveLength(1);
    });
  });

  describe("data-driven rendering", () => {
    it("renders all supplied offer values", () => {
      const { container } = renderOfferCard();

      expect(screen.getByRole("heading", { name: OFFER_CARD_FIXTURE.header })).toBeInTheDocument();
      expect(screen.getByText(OFFER_CARD_FIXTURE.supplementalText)).toBeInTheDocument();
      expect(container.querySelectorAll("dd").item(0)).toHaveTextContent("$526");
      const aprValue = container.querySelectorAll("dd").item(1);
      expect(aprValue).toHaveTextContent("7.66%");
      expect(aprValue.querySelector("span")).toHaveClass("h3");
      expect(container.querySelectorAll("dd").item(2)).toHaveTextContent("60");
      expect(screen.getByText("$3,500")).toBeInTheDocument();
      expect(screen.getByText("$14,399")).toBeInTheDocument();
      expect(screen.getByText("$21,800")).toBeInTheDocument();
    });
  });

  describe("CTA label", () => {
    it("uses the default label when no override is supplied", () => {
      for (const minimized of [false, true]) {
        const { unmount } = renderOfferCard({ minimized });

        expect(
          screen.getByRole("button", { name: OFFER_CARD_DEFAULT_CTA_LABEL })
        ).toBeInTheDocument();

        unmount();
      }
    });

    it("uses the supplied label in both variations", () => {
      for (const minimized of [false, true]) {
        const { unmount } = renderOfferCard({ ctaLabel: "Choose this offer", minimized });

        expect(screen.getByRole("button", { name: "Choose this offer" })).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe("optional trade-in value", () => {
    it("omits trade-in output when no value is supplied", () => {
      for (const minimized of [false, true]) {
        const { container, unmount } = renderOfferCard({
          minimized,
          tradeInValue: undefined,
        });
        const text = container.textContent ?? "";

        expect(screen.queryByText("Estimated Trade-In Value")).not.toBeInTheDocument();
        expect(text).not.toContain("$21,800");
        expect(text).not.toContain("est. trade-in");
        expect(text).not.toContain("$0");

        unmount();
      }
    });
  });

  describe("primitive usage and sizing", () => {
    it("uses the required UI primitives and card width contract", () => {
      const { container } = renderOfferCard();
      const card = container.querySelector('[data-slot="card"]');
      const requiredSlots = [
        "card",
        "card-header",
        "card-content",
        "card-footer",
        "separator",
        "button",
      ];

      for (const slot of requiredSlots) {
        expect(container.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }

      expect(container.querySelectorAll('[data-slot="card-content"]')).toHaveLength(2);
      expect(card).toHaveClass("w-full");
      expect(
        Array.from(card?.classList ?? []).some((className) => className.startsWith("max-w-"))
      ).toBe(false);
    });
  });
});
