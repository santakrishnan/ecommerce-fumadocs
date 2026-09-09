import { EditorialCardButton } from "@shared/components/editorial-card/editorial-card-button";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  buttonWithCustomLabel,
  defaultButtonProps,
} from "../__fixtures__/editorial-card-button.fixture";

describe("EditorialCardButton", () => {
  it("renders the label text", () => {
    render(<EditorialCardButton {...defaultButtonProps} />);
    expect(screen.getByText(defaultButtonProps.label as string)).toBeInTheDocument();
  });

  it("does not render any icon inside the button", () => {
    const { container } = render(<EditorialCardButton {...defaultButtonProps} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(<EditorialCardButton {...defaultButtonProps} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("uses label as aria-label when provided", () => {
    render(<EditorialCardButton {...defaultButtonProps} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", defaultButtonProps.label);
  });

  it("renders custom label as aria-label and button text", () => {
    render(<EditorialCardButton {...buttonWithCustomLabel} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", buttonWithCustomLabel.label);
    expect(button).toHaveTextContent(buttonWithCustomLabel.label);
  });

  it("renders with size lg and variant neutral styling", () => {
    render(<EditorialCardButton {...defaultButtonProps} />);
    const button = screen.getByRole("button");
    // Button primitive applies lg + neutral via CVA — verify known output classes
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("rounded-full");
  });
});
