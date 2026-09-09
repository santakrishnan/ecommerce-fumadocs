import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  dealerOfferFullFixture,
  dealerOfferNoPersonalizationFixture,
} from "../__fixtures__/dealer-offer.fixtures";
import { DealerOfferCard } from "../components/dealer-offer/dealer-offer-card";

describe("DealerOfferCard", () => {
  it("renders eyebrow (dealer name) with correct token classes and heading as <h3>", () => {
    render(<DealerOfferCard data={dealerOfferFullFixture} />);

    const eyebrow = screen.getByText("Parkway Toyota");
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveClass("body-lg");
    expect(eyebrow).toHaveClass("text-text-primary");

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "$1000 OFF HYBRID CARS AND SUVS",
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("h3");
  });

  it("hides personalization when absent", () => {
    const { container } = render(<DealerOfferCard data={dealerOfferNoPersonalizationFixture} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "4.75% APR FOR 72 MO." })
    ).toBeInTheDocument();

    const iconRow = container.querySelector("[aria-hidden='true']");
    expect(iconRow).toBeNull();
  });

  it("renders accessible link with aria-label combining name and offerHeadline", () => {
    render(<DealerOfferCard data={dealerOfferFullFixture} />);

    const link = screen.getByRole("link", {
      name: "Parkway Toyota: $1000 OFF HYBRID CARS AND SUVS",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dealers/parkway-toyota");
  });

  it("applies correct card styling (rounded-xl overflow-hidden)", () => {
    const { container } = render(<DealerOfferCard data={dealerOfferFullFixture} />);

    const card = container.querySelector("[data-slot='dealer-offer-card']");
    expect(card).toHaveClass("rounded-xl");
    expect(card).toHaveClass("overflow-clip");
  });

  it("renders badge when data.badge is present", () => {
    render(<DealerOfferCard data={dealerOfferFullFixture} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("does not render badge when showBadge is false", () => {
    render(<DealerOfferCard data={dealerOfferFullFixture} showBadge={false} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("does not render badge when data.badge is absent", () => {
    render(<DealerOfferCard data={dealerOfferNoPersonalizationFixture} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("renders badge with iconName resolved from icon map", () => {
    const dataWithIcon = {
      ...dealerOfferFullFixture,
      badge: { label: "AI Match", variant: "white" as const, iconName: "bolt" as const },
    };
    const { container } = render(<DealerOfferCard data={dataWithIcon} />);
    expect(screen.getByText("AI Match")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
