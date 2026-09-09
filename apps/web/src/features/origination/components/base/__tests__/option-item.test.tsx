/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { OptionItem } from "../option-item";

describe("OptionItem", () => {
  it("renders as a button element", () => {
    render(<OptionItem id="finance" title="Finance" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<OptionItem id="finance" title="Finance" />);
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<OptionItem description="Apply for financing" id="finance" title="Finance" />);
    expect(screen.getByText("Apply for financing")).toBeInTheDocument();
  });

  it("does not render a description when omitted", () => {
    render(<OptionItem id="cash" title="Pay in full" />);
    expect(screen.queryByText("Apply for financing")).not.toBeInTheDocument();
  });

  it("sets data-element-id attribute", () => {
    render(<OptionItem id="finance" title="Finance" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-element-id", "finance");
  });

  it("renders the chevron icon", () => {
    const { container } = render(<OptionItem id="finance" title="Finance" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
