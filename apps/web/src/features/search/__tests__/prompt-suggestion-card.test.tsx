/// <reference types="@testing-library/jest-dom" />
import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { PromptSuggestionCard, PromptSuggestionList } from "../components/prompt-suggestion-card";
import {
  MOCK_PROMPT_SUGGESTIONS,
  MOCK_SUGGESTION_WITH_IMAGE,
  MOCK_SUGGESTION_WITHOUT_IMAGE,
} from "../data/mock-prompt-suggestions";

const USE_CLIENT_PATTERN = /["']use client["']/;

describe("PromptSuggestionCard", () => {
  it("renders a left-aligned thumbnail via ItemMedia (AC-1)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const media = container.querySelector("[data-slot='item-media']");
    expect(media).toBeInTheDocument();
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", MOCK_SUGGESTION_WITH_IMAGE.imageAlt);
  });

  it("renders a bold primary title via ItemTitle (AC-2)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const title = container.querySelector("[data-slot='item-title']");
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe(MOCK_SUGGESTION_WITH_IMAGE.title);
    expect(title?.className).toContain("subhead-sm");
  });

  it("renders a muted subtitle via ItemDescription (AC-3)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const desc = container.querySelector("[data-slot='item-description']");
    expect(desc).toBeInTheDocument();
    expect(desc?.textContent).toContain(MOCK_SUGGESTION_WITH_IMAGE.subtitle);
  });

  it("renders a right-aligned chevron via ItemActions (AC-4)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const actions = container.querySelector("[data-slot='item-actions'] svg");
    expect(actions).toBeInTheDocument();
    expect(actions).toHaveAttribute("aria-hidden", "true");
  });

  it("has a dark rounded background with border (AC-5, AC-6)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const item = container.firstElementChild;
    expect(item?.className).toContain("bg-white/20");
    expect(item?.className).toContain("rounded-xl");
    expect(item?.className).toContain("border");
  });

  it("entire card is a clickable link (AC-7)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", MOCK_SUGGESTION_WITH_IMAGE.href);
  });

  it("card has role=listitem for semantic list structure (AC-8)", () => {
    render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const item = screen.getByRole("listitem");
    expect(item.tagName).toBe("A");
  });

  it("renders a gray placeholder when no image is provided (AC-9)", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITHOUT_IMAGE} />);
    const img = container.querySelector("img");
    expect(img).not.toBeInTheDocument();
    const placeholder = container.querySelector("[data-slot='item-media'] [aria-hidden='true']");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder?.className).toContain("bg-neutral-600");
  });

  it("accepts dynamic content via props (AC-10)", () => {
    const custom = {
      href: "/custom",
      id: "custom-test",
      imageSrc: "/custom.jpg",
      subtitle: "Custom subtitle",
      title: "Custom title",
    };
    const { container } = render(<PromptSuggestionCard {...custom} />);
    expect(screen.getByText("Custom title")).toBeInTheDocument();
    expect(screen.getByText("Custom subtitle")).toBeInTheDocument();
    expect(container.querySelector("a")).toHaveAttribute("href", "/custom");
  });

  it("has correct title typography", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const title = container.querySelector("[data-slot='item-title']");
    expect(title?.className).toContain("subhead-sm");
    expect(title?.className).toContain("lg:subhead-lg");
  });

  it("has correct subtitle typography", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const desc = container.querySelector("[data-slot='item-description']");
    expect(desc?.className).toContain("body-sm");
  });

  it("shows spark icon when showSpark is true", () => {
    const { container } = render(
      <PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} showSpark />
    );
    const sparkIcon = container.querySelector("[data-slot='item-description'] svg");
    expect(sparkIcon).toBeInTheDocument();
  });

  it("does not show spark icon when showSpark is false", () => {
    const { container } = render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} />);
    const sparkIcon = container.querySelector("[data-slot='item-description'] svg");
    expect(sparkIcon).not.toBeInTheDocument();
  });

  it("is a Server Component — no 'use client' directive", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.resolve(
      import.meta.dirname,
      "../components/prompt-suggestion-card/prompt-suggestion-card.tsx"
    );
    const firstLine = fs.readFileSync(filePath, "utf-8").trimStart().split("\n")[0];
    expect(firstLine).not.toMatch(USE_CLIENT_PATTERN);
  });

  describe("onClick handler", () => {
    it("invokes onClick on user click and receives the mouse event", async () => {
      const user = userEvent.setup({ delay: null });
      const handleClick = vi.fn();

      render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} onClick={handleClick} />);

      const link = screen.getByRole("listitem");
      await user.click(link);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.objectContaining({ type: "click" }));
    });

    it("allows preventDefault to block default navigation", async () => {
      const user = userEvent.setup({ delay: null });
      const handleClick = vi.fn((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
      });

      render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} onClick={handleClick} />);

      const link = screen.getByRole("listitem");
      await user.click(link);

      expect(handleClick).toHaveBeenCalledTimes(1);
      // Verify the event's defaultPrevented was set by our handler
      const event = handleClick.mock.calls[0]?.[0] as unknown as MouseEvent;
      expect(event.defaultPrevented).toBe(true);
    });

    it("invokes onClick when activated via keyboard Enter", async () => {
      const user = userEvent.setup({ delay: null });
      const handleClick = vi.fn((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
      });

      render(<PromptSuggestionCard {...MOCK_SUGGESTION_WITH_IMAGE} onClick={handleClick} />);

      const link = screen.getByRole("listitem");
      link.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe("PromptSuggestionList", () => {
  it("renders a section label above the cards", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    expect(screen.getByText("Suggestions to get started")).toBeInTheDocument();
  });

  it("uses ItemGroup with role=list and aria-label", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    const list = screen.getByRole("list", { name: "Suggestions to get started" });
    expect(list).toBeInTheDocument();
  });

  it("renders each suggestion card with role=listitem", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(MOCK_PROMPT_SUGGESTIONS.length);
  });

  it("renders each suggestion card title", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    for (const suggestion of MOCK_PROMPT_SUGGESTIONS) {
      expect(screen.getByText(suggestion.title)).toBeInTheDocument();
    }
  });

  it("cards are separated by consistent vertical gap (AC-11)", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    const list = screen.getByRole("list", { name: "Suggestions to get started" });
    expect(list.className).toContain("gap-2.5");
  });

  it("returns null when suggestions array is empty", () => {
    const { container } = render(<PromptSuggestionList suggestions={[]} />);
    expect(container.querySelector("section")).not.toBeInTheDocument();
  });

  it("accepts a custom section label", () => {
    render(
      <PromptSuggestionList sectionLabel="Custom label" suggestions={MOCK_PROMPT_SUGGESTIONS} />
    );
    expect(screen.getByText("Custom label")).toBeInTheDocument();
  });

  it("is full width — no breakpoint max-widths on the component", () => {
    const { container } = render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).not.toContain("max-w-");
  });

  it("list has overflow-y-auto for scrollable behavior", () => {
    render(<PromptSuggestionList suggestions={MOCK_PROMPT_SUGGESTIONS} />);
    const list = screen.getByRole("list", { name: "Suggestions to get started" });
    expect(list.className).toContain("overflow-y-auto");
  });
});
