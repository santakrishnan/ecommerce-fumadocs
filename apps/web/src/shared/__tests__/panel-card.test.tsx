import { PanelCard } from "@shared/components/card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("PanelCard", () => {
  it("renders children", () => {
    render(<PanelCard>Hello</PanelCard>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("always sets data-surface=dark", () => {
    render(<PanelCard data-testid="panel">Content</PanelCard>);
    expect(screen.getByTestId("panel")).toHaveAttribute("data-surface", "dark");
  });

  it("applies bg-card-dark background class", () => {
    render(<PanelCard data-testid="panel">Content</PanelCard>);
    const card = screen.getByTestId("panel");
    expect(card).toHaveClass("bg-card-dark");
  });

  it("applies text-text-primary class", () => {
    render(<PanelCard data-testid="panel">Content</PanelCard>);
    const card = screen.getByTestId("panel");
    expect(card).toHaveClass("text-text-primary");
  });

  it("merges custom className", () => {
    render(
      <PanelCard className="w-96" data-testid="panel">
        Content
      </PanelCard>
    );
    expect(screen.getByTestId("panel")).toHaveClass("w-96");
  });

  it("renders using the Card primitive with data-slot=panel-card", () => {
    render(<PanelCard data-testid="panel">Content</PanelCard>);
    expect(screen.getByTestId("panel")).toHaveAttribute("data-slot", "panel-card");
  });

  it("passes data-testid to the root element via rest props", () => {
    render(<PanelCard data-testid="my-panel">Content</PanelCard>);
    expect(screen.getByTestId("my-panel")).toBeInTheDocument();
  });

  it("resets Card default shadow and ring", () => {
    render(<PanelCard data-testid="panel">Content</PanelCard>);
    const card = screen.getByTestId("panel");
    expect(card).toHaveClass("shadow-none", "ring-0");
  });
});
