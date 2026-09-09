import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ButtonCard } from "../button-card";

describe("ButtonCard", () => {
  it("renders a button element", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }}>
        <span>Card content</span>
      </ButtonCard>
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("sets type='button' on the underlying button", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }}>
        <span>Content</span>
      </ButtonCard>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("fires onClick when the button is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    const handleClick = vi.fn();
    render(
      <ButtonCard buttonProps={{ onClick: handleClick }}>
        <span>Click me</span>
      </ButtonCard>
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("spreads aria-label onto the button", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn(), "aria-label": "Select Camry" }}>
        <span>Content</span>
      </ButtonCard>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Select Camry");
  });

  it("renders children inside the card surface", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }}>
        <span data-testid="child">Hello</span>
      </ButtonCard>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders adornments as siblings outside the card surface", () => {
    const { container } = render(
      <ButtonCard
        adornments={<button type="button">Save</button>}
        buttonProps={{ onClick: vi.fn() }}
      >
        <span>Content</span>
      </ButtonCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    // Adornments render as a sibling div after the card surface
    const adornmentsDiv = wrapper?.querySelector(".pointer-events-none");
    expect(adornmentsDiv).not.toBeNull();
    expect(adornmentsDiv?.querySelector("button")).toHaveTextContent("Save");
  });

  it("does not render adornments slot when adornments is omitted", () => {
    const { container } = render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }}>
        <span>Content</span>
      </ButtonCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    const adornmentsDiv = wrapper?.querySelector(".pointer-events-none");
    expect(adornmentsDiv).toBeNull();
  });

  it("applies className to the card surface", () => {
    const { container } = render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }} className="bg-blue-500">
        <span>Content</span>
      </ButtonCard>
    );
    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveClass("bg-blue-500");
  });

  it("applies wrapperClassName to the card-root div", () => {
    const { container } = render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }} wrapperClassName="w-[300px]">
        <span>Content</span>
      </ButtonCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    expect(wrapper).toHaveClass("w-[300px]");
  });

  it("adds data-carousel-focus on the button for keyboard navigation", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn() }}>
        <span>Content</span>
      </ButtonCard>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-carousel-focus");
  });

  it("supports disabled state via buttonProps", () => {
    render(
      <ButtonCard buttonProps={{ onClick: vi.fn(), disabled: true }}>
        <span>Content</span>
      </ButtonCard>
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
