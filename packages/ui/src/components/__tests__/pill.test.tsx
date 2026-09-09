/// <reference types="@testing-library/jest-dom/vitest" />
import { Pill, PillGroup } from "@ucmp/ui";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("Pill", () => {
  it('renders with data-slot="pill"', () => {
    render(<Pill>Label</Pill>);
    expect(document.querySelector('[data-slot="pill"]')).toBeInTheDocument();
  });

  it("root element is a button", () => {
    render(<Pill>Label</Pill>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies rounded-full class", () => {
    render(<Pill>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-full");
  });

  it("applies typography classes", () => {
    render(<Pill>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-xs", "tracking-tighter");
  });

  it("applies outline-none and transition-colors", () => {
    render(<Pill>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("outline-none", "transition-colors");
  });

  it("applies focus-visible ring classes", () => {
    render(<Pill>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "focus-visible:border-ring",
      "focus-visible:ring-3",
      "focus-visible:ring-ring/50"
    );
  });

  it("applies disabled classes when disabled", () => {
    render(<Pill disabled>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(
      "aria-disabled:pointer-events-none",
      "aria-disabled:opacity-50"
    );
  });

  it("toggles aria-pressed via click then close button", async () => {
    const user = userEvent.setup();
    render(<Pill>Toggle</Pill>);
    const button = screen.getByRole("button", { name: "Toggle" });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    const closeBtn = screen.getByRole("button", { name: "Remove" });
    await user.click(closeBtn);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking pill body while selected does nothing when hideClose is not set", async () => {
    const user = userEvent.setup();
    render(<Pill>Toggle</Pill>);
    const button = screen.getByRole("button", { name: "Toggle" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking pill body while selected deselects when hideClose is set", async () => {
    const user = userEvent.setup();
    render(<Pill hideClose>Toggle</Pill>);
    const button = screen.getByRole("button", { name: "Toggle" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("close button is not rendered when hideClose is set", async () => {
    const user = userEvent.setup();
    render(<Pill hideClose>Toggle</Pill>);
    const button = screen.getByRole("button", { name: "Toggle" });

    await user.click(button);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("close button is not rendered when pill is disabled", async () => {
    render(<Pill disabled defaultPressed>Toggle</Pill>);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("close button is not rendered when pill is unselected", () => {
    render(<Pill>Toggle</Pill>);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("renders child with data-icon='inline-start' before label text", () => {
    render(
      <Pill>
        <svg data-icon="inline-start" data-testid="lead" />
        Label
      </Pill>
    );
    const lead = screen.getByTestId("lead");
    expect(lead).toBeInTheDocument();

    const button = screen.getByRole("button");
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === "Label"
    );
    expect(textNode).toBeDefined();
    const position = lead.compareDocumentPosition(textNode as Node);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders child with data-icon='inline-end' after label text", () => {
    render(
      <Pill>
        Label
        <svg data-icon="inline-end" data-testid="trail" />
      </Pill>
    );
    const trail = screen.getByTestId("trail");
    expect(trail).toBeInTheDocument();

    const button = screen.getByRole("button");
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === "Label"
    );
    expect(textNode).toBeDefined();
    const position = trail.compareDocumentPosition(textNode as Node);
    expect(position & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("applies has-data-[icon=inline-start] padding class when leading adornment present", () => {
    render(
      <Pill>
        <svg data-icon="inline-start" />
        Label
      </Pill>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("has-data-[icon=inline-start]:ps-5");
  });

  it("applies has-data-[icon=inline-end] padding class when trailing adornment present", () => {
    render(
      <Pill>
        Label
        <svg data-icon="inline-end" />
      </Pill>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("has-data-[icon=inline-end]:pe-5");
  });

  it("renders no data-icon elements when no adornments passed", () => {
    render(<Pill>Label</Pill>);
    const button = screen.getByRole("button");
    expect(button.querySelector("[data-icon]")).toBeNull();
  });
});

describe("PillGroup", () => {
  it('renders with data-slot="pill-group"', () => {
    render(
      <PillGroup>
        <Pill>A</Pill>
      </PillGroup>
    );
    expect(
      document.querySelector('[data-slot="pill-group"]')
    ).toBeInTheDocument();
  });

  it("applies flex and flex-wrap classes", () => {
    render(
      <PillGroup>
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveClass("flex", "flex-wrap");
  });

  it('sets data-surface="dark" when surface="dark"', () => {
    render(
      <PillGroup surface="dark">
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveAttribute("data-surface", "dark");
  });

  it('sets data-surface="light" when surface="light"', () => {
    render(
      <PillGroup surface="light">
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveAttribute("data-surface", "light");
  });

  it("does not set data-surface when surface is not provided", () => {
    render(
      <PillGroup>
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).not.toHaveAttribute("data-surface");
  });

  it('applies gap-1 when density="compact"', () => {
    render(
      <PillGroup density="compact">
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveClass("gap-1");
  });

  it('applies gap-2 when density="standard"', () => {
    render(
      <PillGroup density="standard">
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveClass("gap-2");
  });

  it("applies gap-2 by default when no density provided", () => {
    render(
      <PillGroup>
        <Pill>A</Pill>
      </PillGroup>
    );
    const group = document.querySelector('[data-slot="pill-group"]');
    expect(group).toHaveClass("gap-2");
  });

  it("single-select: selecting a new pill deselects the previous", async () => {
    const user = userEvent.setup();
    render(
      <PillGroup>
        <Pill value="a">A</Pill>
        <Pill value="b">B</Pill>
      </PillGroup>
    );

    const buttonA = screen.getByRole("button", { name: "A" });
    const buttonB = screen.getByRole("button", { name: "B" });

    await user.click(buttonA);
    expect(buttonA).toHaveAttribute("aria-pressed", "true");

    await user.click(buttonB);
    expect(buttonB).toHaveAttribute("aria-pressed", "true");

    // In single-select mode at most one pill should be pressed
    const allPillButtons = Array.from(
      document.querySelectorAll('[data-slot="pill"]')
    ) as HTMLElement[]
    const pressedButtons = allPillButtons.filter(
      (btn) => btn.getAttribute("aria-pressed") === "true"
    );
    expect(pressedButtons).toHaveLength(1);
  });

  it("multi-select: multiple pills can be pressed simultaneously", async () => {
    const user = userEvent.setup();
    render(
      <PillGroup multiple>
        <Pill value="a">A</Pill>
        <Pill value="b">B</Pill>
      </PillGroup>
    );

    const buttonA = screen.getByRole("button", { name: "A" });
    const buttonB = screen.getByRole("button", { name: "B" });

    await user.click(buttonA);
    await user.click(buttonB);

    expect(buttonA).toHaveAttribute("aria-pressed", "true");
    expect(buttonB).toHaveAttribute("aria-pressed", "true");
  });
});
