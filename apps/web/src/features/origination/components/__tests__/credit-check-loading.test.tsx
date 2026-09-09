/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import { CREDIT_CHECK_LOADING_LABEL, CreditCheckLoading } from "../credit-check-loading";

describe("CreditCheckLoading", () => {
  it("renders the credit check label", () => {
    render(<CreditCheckLoading />);

    expect(screen.getByText(CREDIT_CHECK_LOADING_LABEL)).toBeInTheDocument();
  });

  it("has an accessible status role with the label as its accessible name", () => {
    render(<CreditCheckLoading />);

    expect(screen.getByRole("status", { name: CREDIT_CHECK_LOADING_LABEL })).toBeInTheDocument();
  });

  it("renders the brand variant — no SVG image element (no background photo)", () => {
    const { container } = render(<CreditCheckLoading />);

    expect(container.querySelector("image")).not.toBeInTheDocument();
  });

  it("fills the viewport — root element has min-h-dvh class", () => {
    const { container } = render(<CreditCheckLoading />);

    expect(container.firstChild).toHaveClass("min-h-dvh");
  });

  it("truncates the label (brand variant text style)", () => {
    render(<CreditCheckLoading />);

    expect(screen.getByText(CREDIT_CHECK_LOADING_LABEL)).toHaveClass("truncate");
  });
});
