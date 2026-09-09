/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import { TRADE_IN_OFFER_TEXT, TradeInOfferContent } from "../trade-in-offer-content";

describe("TradeInOfferContent", () => {
  it("exports the correct static copy constant", () => {
    expect(TRADE_IN_OFFER_TEXT).toBe("Trade-in offer flow");
  });

  it("renders the copy on screen", () => {
    render(<TradeInOfferContent />);

    expect(screen.getByText(TRADE_IN_OFFER_TEXT)).toBeInTheDocument();
  });

  it("renders the copy as an h1 heading", () => {
    render(<TradeInOfferContent />);

    expect(
      screen.getByRole("heading", { level: 1, name: TRADE_IN_OFFER_TEXT })
    ).toBeInTheDocument();
  });

  it("fills the viewport — root element has min-h-dvh class", () => {
    const { container } = render(<TradeInOfferContent />);

    expect(container.firstChild).toHaveClass("min-h-dvh");
  });
});
