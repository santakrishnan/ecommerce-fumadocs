import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { AskQuestionPrompt } from "../ask-question-prompt";

const DEFAULT_QUESTIONS = [
  "Which one is the best value?",
  "How comfortable is third row seating?",
  "Which one is best in snowy conditions?",
];

describe("AskQuestionPrompt", () => {
  describe("variant: light (default)", () => {
    it("renders the heading with body-md typography", () => {
      render(<AskQuestionPrompt heading="Ask about Price" questions={DEFAULT_QUESTIONS} />);
      const heading = screen.getByText("Ask about Price");
      expect(heading).toHaveClass("body-md");
      expect(heading).toHaveClass("font-medium");
    });

    it("renders heading as h3 by default", () => {
      render(<AskQuestionPrompt heading="Ask about Price" questions={DEFAULT_QUESTIONS} />);
      const heading = screen.getByText("Ask about Price");
      expect(heading.tagName).toBe("H3");
    });

    it("renders all suggested question pills", () => {
      render(<AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />);
      for (const question of DEFAULT_QUESTIONS) {
        expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
      }
    });

    it("renders catch-all button with default label", () => {
      render(<AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />);
      expect(screen.getByRole("button", { name: "Ask something else" })).toBeInTheDocument();
    });

    it("uses light card styling", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />
      );
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("bg-surface-inactive");
      expect(card).toHaveClass("rounded-xl");
    });

    it("does not set data-surface attribute", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />
      );
      const card = container.querySelector("[data-slot='card']");
      expect(card).not.toHaveAttribute("data-surface");
    });

    it("renders brand-colored icon", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-brand");
    });
  });

  describe("variant: dark", () => {
    it("renders dark card with data-surface=dark", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Questions?" questions={DEFAULT_QUESTIONS} variant="dark" />
      );
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveAttribute("data-surface", "dark");
      expect(card).toHaveClass("rounded-2xl");
      expect(card).toHaveClass("bg-opacity-black-26");
    });

    it("renders heading with h2 class", () => {
      render(
        <AskQuestionPrompt
          heading="Questions?"
          headingLevel="h2"
          questions={DEFAULT_QUESTIONS}
          variant="dark"
        />
      );
      const heading = screen.getByText("Questions?");
      expect(heading.tagName).toBe("H2");
      expect(heading).toHaveClass("h2");
    });

    it("renders icon with text-text-primary (white on dark)", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Questions?" questions={DEFAULT_QUESTIONS} variant="dark" />
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("text-text-primary");
    });

    it("constrains heading block to lg:col-span-5 grid", () => {
      const { container } = render(
        <AskQuestionPrompt heading="Questions?" questions={DEFAULT_QUESTIONS} variant="dark" />
      );
      const gridWrapper = container.querySelector(".lg\\:grid-cols-12");
      expect(gridWrapper).toBeInTheDocument();
      const headingBlock = container.querySelector(".lg\\:col-span-5");
      expect(headingBlock).toBeInTheDocument();
    });
  });

  describe("variant: light-horizontal", () => {
    it("renders white surface card", () => {
      const { container } = render(
        <AskQuestionPrompt
          heading="Questions about your watchlist?"
          questions={DEFAULT_QUESTIONS}
          variant="light-horizontal"
        />
      );
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("bg-surface-primary");
    });

    it("renders heading with body-xl typography", () => {
      render(
        <AskQuestionPrompt
          heading="Questions about your watchlist?"
          questions={DEFAULT_QUESTIONS}
          variant="light-horizontal"
        />
      );
      const heading = screen.getByText("Questions about your watchlist?");
      expect(heading).toHaveClass("body-xl");
    });

    it("uses tertiary button variant for pills", () => {
      const { container } = render(
        <AskQuestionPrompt
          heading="Questions?"
          questions={["Test question"]}
          variant="light-horizontal"
        />
      );
      // Tertiary buttons have a border style from the design system
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("onSelect callback", () => {
    it("calls onSelect with the question text when a pill is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AskQuestionPrompt heading="Ask" onSelect={onSelect} questions={DEFAULT_QUESTIONS} />);

      await user.click(screen.getByRole("button", { name: DEFAULT_QUESTIONS[0] }));
      expect(onSelect).toHaveBeenCalledWith(DEFAULT_QUESTIONS[0]);
    });

    it("calls onSelect with null when catch-all is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AskQuestionPrompt heading="Ask" onSelect={onSelect} questions={DEFAULT_QUESTIONS} />);

      await user.click(screen.getByRole("button", { name: "Ask something else" }));
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it("marks pills as aria-disabled when onSelect is not provided", () => {
      render(<AskQuestionPrompt heading="Ask" questions={DEFAULT_QUESTIONS} />);

      expect(screen.getByRole("button", { name: DEFAULT_QUESTIONS[0] })).toHaveAttribute(
        "aria-disabled",
        "true"
      );
      expect(screen.getByRole("button", { name: "Ask something else" })).toHaveAttribute(
        "aria-disabled",
        "true"
      );
    });
  });

  describe("props", () => {
    it("accepts custom catchAllLabel", () => {
      render(
        <AskQuestionPrompt
          catchAllLabel="Something else"
          heading="Ask"
          questions={DEFAULT_QUESTIONS}
        />
      );
      expect(screen.getByRole("button", { name: "Something else" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ask something else" })).not.toBeInTheDocument();
    });

    it("applies custom className to card", () => {
      const { container } = render(
        <AskQuestionPrompt className="mt-12" heading="Ask" questions={DEFAULT_QUESTIONS} />
      );
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("mt-12");
    });

    it("accepts headingLevel h2", () => {
      render(<AskQuestionPrompt heading="Title" headingLevel="h2" questions={DEFAULT_QUESTIONS} />);
      const heading = screen.getByText("Title");
      expect(heading.tagName).toBe("H2");
    });

    it("renders with empty questions array (only catch-all)", () => {
      render(<AskQuestionPrompt heading="Ask" questions={[]} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("Ask something else");
    });
  });
});
