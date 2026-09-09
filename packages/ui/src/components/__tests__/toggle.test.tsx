/// <reference types="@testing-library/jest-dom/vitest" />
import { Toggle } from "@ucmp/ui";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

describe("Toggle — default variant (Save Search)", () => {
  it("renders as a button with aria-pressed=false by default", () => {
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles aria-pressed on click", async () => {
    const user = userEvent.setup();
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles aria-pressed on Space key", async () => {
    const user = userEvent.setup();
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles aria-pressed on Enter key", async () => {
    const user = userEvent.setup();
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onPressedChange when toggled", async () => {
    const onPressedChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle onPressedChange={onPressedChange}>Save search</Toggle>);

    await user.click(screen.getByRole("button", { name: "Save search" }));
    expect(onPressedChange).toHaveBeenCalled();
  });

  it("respects controlled pressed prop", () => {
    render(<Toggle pressed>Search saved</Toggle>);

    expect(screen.getByRole("button", { name: "Search saved" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("applies consumer className for text color", () => {
    render(<Toggle className="text-text-inverse">Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toHaveClass("text-text-inverse");
  });

  it("renders with data-slot=toggle", () => {
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toHaveAttribute("data-slot", "toggle");
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Toggle disabled>Save search</Toggle>);

    expect(screen.getByRole("button", { name: "Save search" })).toBeDisabled();
  });

  it("does not toggle when disabled", async () => {
    const onPressedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        Save search
      </Toggle>
    );

    await user.click(screen.getByRole("button", { name: "Save search" }));
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});

describe("Toggle — focus ring (accessibility)", () => {
  it("applies focus-visible:ring-2 focus-visible:ring-ring/50 for keyboard focus", () => {
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toHaveClass("focus-visible:ring-2");
    expect(toggle).toHaveClass("focus-visible:ring-ring/50");
  });
});

describe("Toggle — default variant styling", () => {
  it("applies bg-transparent for default variant background", () => {
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toHaveClass("bg-transparent");
  });

  it("applies hover:bg-transparent for default variant hover", () => {
    render(<Toggle>Save search</Toggle>);

    const toggle = screen.getByRole("button", { name: "Save search" });
    expect(toggle).toHaveClass("hover:bg-transparent");
  });

  it("applies aria-pressed:bg-transparent for default variant pressed state", () => {
    render(<Toggle pressed>Search saved</Toggle>);

    const toggle = screen.getByRole("button", { name: "Search saved" });
    expect(toggle).toHaveClass("aria-pressed:bg-transparent");
  });
});

describe("Toggle — icon variant (Inventory Save)", () => {
  it("renders icon-only toggle with aria-label", () => {
    render(
      <Toggle variant="icon" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles aria-pressed on click for icon variant", async () => {
    const user = userEvent.setup();
    render(
      <Toggle variant="icon" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("applies --color-surface-inverse-muted background for icon variant", () => {
    render(
      <Toggle variant="icon" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toHaveClass("bg-surface-inverse-muted");
  });

  it("applies hover:bg-muted for icon variant hover", () => {
    render(
      <Toggle variant="icon" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toHaveClass("hover:bg-muted");
  });

  it("applies --color-surface-inverse-muted for icon variant pressed state", () => {
    render(
      <Toggle variant="icon" aria-label="Save to watchlist" pressed>
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toHaveClass("aria-pressed:bg-surface-inverse-muted");
  });

  it("applies backdrop-blur for icon variant frosted glass effect", () => {
    render(
      <Toggle variant="icon" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toHaveClass("backdrop-blur-[2px]");
  });

  it("accepts consumer className override for mobile size", () => {
    render(
      <Toggle variant="icon" className="size-7" aria-label="Save to watchlist">
        <svg data-testid="icon" />
      </Toggle>
    );

    const toggle = screen.getByRole("button", { name: "Save to watchlist" });
    expect(toggle).toHaveClass("size-7");
  });
});
