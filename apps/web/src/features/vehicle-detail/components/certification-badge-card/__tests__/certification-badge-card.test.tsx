import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

import { CertificationBadgeCard } from "../certification-badge-card";

const GOLD_INSPECTION_REGEX = /160-point inspection/;
const SILVER_INSPECTION_REGEX = /136-point inspection/;

describe("CertificationBadgeCard", () => {
  describe("when tier is false", () => {
    it("renders nothing", () => {
      const { container } = render(<CertificationBadgeCard model="Highlander" tier={false} />);

      expect(container.innerHTML).toBe("");
    });
  });

  describe("when tier is gold", () => {
    it("renders the card with correct aria-label", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const card = screen.getByLabelText("Toyota Gold Certified badge");
      expect(card).toBeInTheDocument();
    });

    it("renders the gold headline with vehicle model", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "This Highlander is Toyota Gold Certified"
      );
    });

    it("renders the 160-point inspection description", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      expect(screen.getByText(GOLD_INSPECTION_REGEX)).toBeInTheDocument();
    });

    it("applies gold title color class", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.className).toContain("text-gold");
    });

    it("renders the gold certification ring image", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const ringImg = screen.getByAltText("Gold certification ring");
      expect(ringImg).toBeInTheDocument();
    });

    it("renders the Toyota emblem image", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const symbolImg = screen.getByAltText("Toyota emblem");
      expect(symbolImg).toBeInTheDocument();
    });

    it("uses data-surface dark attribute", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const card = screen.getByLabelText("Toyota Gold Certified badge");
      expect(card).toHaveAttribute("data-surface", "dark");
    });

    it("applies dark background class", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      const card = screen.getByLabelText("Toyota Gold Certified badge");
      expect(card.className).toContain("bg-surface-dark");
    });

    it("renders the expand button", () => {
      render(<CertificationBadgeCard model="Highlander" tier="gold" />);

      expect(
        screen.getByRole("button", { name: "More certification details" })
      ).toBeInTheDocument();
    });
  });

  describe("when tier is silver", () => {
    it("renders the card with correct aria-label", () => {
      render(<CertificationBadgeCard model="Camry" tier="silver" />);

      const card = screen.getByLabelText("Toyota Silver Certified badge");
      expect(card).toBeInTheDocument();
    });

    it("renders the silver headline with vehicle model", () => {
      render(<CertificationBadgeCard model="Camry" tier="silver" />);

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "This Camry is Toyota Silver Certified"
      );
    });

    it("renders the 136-point inspection description", () => {
      render(<CertificationBadgeCard model="Camry" tier="silver" />);

      expect(screen.getByText(SILVER_INSPECTION_REGEX)).toBeInTheDocument();
    });

    it("applies silver title color class", () => {
      render(<CertificationBadgeCard model="Camry" tier="silver" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.className).toContain("text-silver");
    });

    it("renders the silver certification ring image", () => {
      render(<CertificationBadgeCard model="Camry" tier="silver" />);

      const ringImg = screen.getByAltText("Silver certification ring");
      expect(ringImg).toBeInTheDocument();
    });
  });

  describe("dynamic model name", () => {
    it("inserts the model name into the headline", () => {
      render(<CertificationBadgeCard model="RAV4" tier="gold" />);

      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "This RAV4 is Toyota Gold Certified"
      );
    });
  });
});
