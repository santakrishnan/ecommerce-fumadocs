/// <reference types="@testing-library/jest-dom/vitest" />
import { Badge } from "@ucmp/ui";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("Badge", () => {
  it('renders with data-slot="badge"', () => {
    render(<Badge>Badge</Badge>);

    expect(screen.getByText("Badge")).toHaveAttribute("data-slot", "badge");
  });

  it("uses default styling when variant is omitted", () => {
    render(<Badge>Badge</Badge>);

    const badge = screen.getByText("Badge");
    expect(badge).toHaveClass("bg-card-dark", "text-text-primary-dark");
    expect(badge).toHaveAttribute("data-variant", "default");
  });

  it("uses the disclaimer typography variant", () => {
    render(<Badge>Badge</Badge>);

    const badge = screen.getByText("Badge");
    expect(badge).toHaveClass("disclaimer");
    expect(badge).not.toHaveClass("text-2xs");
    expect(badge).not.toHaveClass("leading-none");
    expect(badge).not.toHaveClass("font-medium");
  });

  it("renders forced runtime variants without throwing", () => {
    render(<Badge variant={"subtle" as never}>Badge</Badge>);

    const badge = screen.getByText("Badge");
    expect(badge).toHaveAttribute("data-variant", "subtle");
  });

  it("renders inverse styling", () => {
    render(<Badge variant="inverse">Badge</Badge>);

    const badge = screen.getByText("Badge");
    expect(badge).toHaveClass("bg-neutral-500", "text-text-secondary-dark");
    expect(badge).toHaveAttribute("data-variant", "inverse");
  });
});
