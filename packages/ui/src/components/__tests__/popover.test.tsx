/// <reference types="@testing-library/jest-dom/vitest" />
import { Popover, PopoverBackdrop, PopoverContent, PopoverTrigger } from "@ucmp/ui";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("Popover", () => {
  it("renders the trigger", () => {
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );

    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("opens popover content when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverContent>
          <p>Popover body</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Popover body")).toBeInTheDocument();
  });

  it("closes popover on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverContent>
          <p>Popover body</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Popover body")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });
});

describe("PopoverBackdrop", () => {
  it("renders backdrop element when popover is open", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop />
        <PopoverContent>
          <p>With backdrop</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).not.toHaveAttribute("hidden");
  });

  it("backdrop has bg-overlay class", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop />
        <PopoverContent>
          <p>With backdrop</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toHaveClass("bg-overlay");
  });

  it("backdrop has fixed positioning and inset-0", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop />
        <PopoverContent>
          <p>With backdrop</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toHaveClass("fixed");
    expect(backdrop).toHaveClass("inset-0");
  });

  it("backdrop is hidden when popover is closed", () => {
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop />
        <PopoverContent>
          <p>With backdrop</p>
        </PopoverContent>
      </Popover>
    );

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop === null || backdrop.hasAttribute("hidden")).toBe(true);
  });

  it("popover without backdrop does not render backdrop element", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverContent>
          <p>No backdrop</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).not.toBeInTheDocument();
  });

  it("accepts custom className via cn merge", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop className="custom-class" />
        <PopoverContent>
          <p>Custom backdrop</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toHaveClass("custom-class");
    expect(backdrop).toHaveClass("bg-overlay");
  });

  it("escape key dismisses popover with backdrop", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger render={<button type="button">Open</button>} />
        <PopoverBackdrop />
        <PopoverContent>
          <p>Dismissable</p>
        </PopoverContent>
      </Popover>
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Dismissable")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Dismissable")).not.toBeInTheDocument();
  });
});
