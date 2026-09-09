/// <reference types="@testing-library/jest-dom/vitest" />

import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SuggestionListbox } from "../components/search-prompt/suggestion-listbox";

const SUGGESTIONS = [
  { label: "Fuel efficient SUVs", value: "fuel-efficient-suvs" },
  { label: "Fuel efficient hybrid", value: "fuel-efficient-hybrid" },
  { label: "Fuel efficient 2024", value: "fuel-efficient-2024" },
];

describe("SuggestionListbox", () => {
  describe("Rendering", () => {
    it("renders nothing when suggestions is empty", () => {
      const { container } = render(
        <SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={[]} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders all suggestions", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      for (const s of SUGGESTIONS) {
        expect(screen.getByText(s.label)).toBeInTheDocument();
      }
    });

    it("renders with role='listbox'", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("renders each suggestion with role='option'", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      expect(screen.getAllByRole("option")).toHaveLength(SUGGESTIONS.length);
    });

    it("renders IconArrowReturnRight for each suggestion", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const icons = screen.getByRole("listbox").querySelectorAll("svg");
      expect(icons).toHaveLength(SUGGESTIONS.length);
    });
  });

  describe("Active state", () => {
    it("marks active suggestion with aria-selected='true'", () => {
      render(<SuggestionListbox activeIndex={1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });

    it("no option is selected when activeIndex is -1", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
    });
  });

  describe("Selection", () => {
    it("calls onSelect with suggestion when clicked", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<SuggestionListbox activeIndex={-1} onSelect={onSelect} suggestions={SUGGESTIONS} />);
      await user.click(screen.getByText("Fuel efficient hybrid"));
      expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1]);
    });

    it("does not blur parent on mouseDown (prevents focus loss)", async () => {
      const onSelect = vi.fn();
      render(<SuggestionListbox activeIndex={-1} onSelect={onSelect} suggestions={SUGGESTIONS} />);
      const option = screen.getAllByRole("option")[0];
      const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault");
      option?.dispatchEvent(mouseDownEvent);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("options have tabIndex=-1", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      for (const option of screen.getAllByRole("option")) {
        expect(option.tabIndex).toBe(-1);
      }
    });

    it("listbox has aria-label", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      expect(screen.getByRole("listbox")).toHaveAttribute("aria-label", "Search suggestions");
    });

    it("each option has a unique id", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const ids = screen.getAllByRole("option").map((el) => el.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(SUGGESTIONS.length);
    });
  });

  describe("Placement", () => {
    it("defaults to bottom placement", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const listbox = screen.getByRole("listbox");
      expect(listbox.className).toContain("top-full");
    });
  });

  describe("Motion lifecycle props", () => {
    it("renders all suggestion options", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      expect(screen.getAllByRole("option")).toHaveLength(SUGGESTIONS.length);
    });
  });

  describe("Selection animation classes", () => {
    it("applies animate-suggestion-tap to clicked card", async () => {
      const user = userEvent.setup();
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      await user.click(screen.getByText("Fuel efficient hybrid"));
      const clickedOption = screen.getByText("Fuel efficient hybrid").closest('[role="option"]');
      expect(clickedOption?.className).toContain("animate-suggestion-tap");
    });

    it("applies animate-suggestion-dim to sibling cards", async () => {
      const user = userEvent.setup();
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      await user.click(screen.getByText("Fuel efficient hybrid"));
      const siblingOption = screen.getByText("Fuel efficient SUVs").closest('[role="option"]');
      expect(siblingOption?.className).toContain("animate-suggestion-dim");
    });
  });

  describe("Tap feedback & reduced motion", () => {
    it("has active:scale-[0.98] for press-in feedback", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const options = screen.getAllByRole("option");
      for (const option of options) {
        expect(option.className).toContain("active:scale-[0.98]");
      }
    });

    it("has motion-reduce:animate-none for accessibility", () => {
      render(<SuggestionListbox activeIndex={-1} onSelect={vi.fn()} suggestions={SUGGESTIONS} />);
      const options = screen.getAllByRole("option");
      for (const option of options) {
        expect(option.className).toContain("motion-reduce:animate-none");
      }
    });
  });
});
