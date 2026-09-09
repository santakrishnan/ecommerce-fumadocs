import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LlmIntroduction } from "../llm-introduction";

const mockUseReducedMotion = vi.fn<() => boolean | null>(() => false);

vi.mock("motion/react", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe("LlmIntroduction", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders all words from mount", () => {
    const { container } = render(<LlmIntroduction text="This vehicle has low mileage" />);

    expect(container.querySelectorAll("[data-word-segment]")).toHaveLength(5);
    expect(screen.getByText("This")).toBeInTheDocument();
    expect(screen.getByText("vehicle")).toBeInTheDocument();
  });

  it("starts with all words hidden", () => {
    const { container } = render(<LlmIntroduction text="This vehicle has low mileage" />);

    const words = container.querySelectorAll("[data-word-segment]");

    for (const word of words) {
      expect(word).toHaveClass("text-transparent");
    }
  });

  it("reveals words sequentially", () => {
    render(<LlmIntroduction intervalMs={100} text="This vehicle has low mileage" />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("This")).not.toHaveClass("text-transparent");
    expect(screen.getByText("vehicle")).toHaveClass("text-transparent");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("vehicle")).not.toHaveClass("text-transparent");
  });

  it("fires onComplete when all words are visible", () => {
    const onComplete = vi.fn();

    render(<LlmIntroduction intervalMs={100} onComplete={onComplete} text="One two" />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows all words immediately for reduced motion", () => {
    mockUseReducedMotion.mockReturnValue(true);

    const { container } = render(<LlmIntroduction text="This vehicle has low mileage" />);

    for (const word of container.querySelectorAll("[data-word-segment]")) {
      expect(word).not.toHaveClass("text-transparent");
    }
  });

  it("cleans up timers on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { unmount } = render(<LlmIntroduction text="This vehicle has low mileage" />);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("resets when text changes", () => {
    const { rerender } = render(<LlmIntroduction intervalMs={100} text="This vehicle" />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("This")).not.toHaveClass("text-transparent");

    rerender(<LlmIntroduction intervalMs={100} text="New content" />);

    expect(screen.getByText("New")).toHaveClass("text-transparent");
    expect(screen.getByText("content")).toHaveClass("text-transparent");
  });

  it("renders newline-separated text in a single paragraph using whitespace-pre-line", () => {
    const { container } = render(
      <LlmIntroduction
        text={
          "It has everything you're looking for, including plenty of space inside, while still compact enough to be perfect for getting around Brooklyn.\nThe other thing to note is that it's a one-owner vehicle with Toyota Gold Certification, which means it comes with added warranty coverage."
        }
      />
    );

    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("p")).toHaveClass("whitespace-pre-line");
  });
});
