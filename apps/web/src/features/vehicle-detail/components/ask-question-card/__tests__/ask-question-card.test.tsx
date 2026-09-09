/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { AskQuestionCard } from "../ask-question-card";

const DEFAULT_PROPS = {
  heading: "Questions about this Highlander Hybrid?",
  model: "Highlander",
  trim: "Hybrid Limited",
  year: 2023,
  suggestions: [
    "How comfortable is the 3rd row seating?",
    "What is the cargo space like?",
    "How does Limited compare to XLE?",
  ],
  vin: "GOLD567890ABCDEFG",
};

describe("AskQuestionCard", () => {
  describe("Rendering", () => {
    it("renders with dark surface data attribute", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const card = container.querySelector("[data-surface='dark']");
      expect(card).toBeInTheDocument();
    });

    it("renders the heading", () => {
      render(<AskQuestionCard {...DEFAULT_PROPS} />);
      expect(screen.getByText("Questions about this Highlander Hybrid?")).toBeInTheDocument();
    });

    it("renders all suggested question pills", () => {
      render(<AskQuestionCard {...DEFAULT_PROPS} />);
      for (const question of DEFAULT_PROPS.suggestions) {
        expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
      }
    });

    it("renders 'Something else' pill as the last button", () => {
      render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const buttons = screen.getAllByRole("button");
      const lastButton = buttons.at(-1);
      expect(lastButton).toHaveTextContent("Something else");
    });

    it("renders the Toyota X brand icon", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("applies custom className to card", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} className="custom-class" />);
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("Data-driven questions", () => {
    it("renders different suggestions when different data is passed", () => {
      const customSuggestions = ["Custom question 1?", "Custom question 2?"];
      render(
        <AskQuestionCard
          heading="Questions about this Camry?"
          model="Camry"
          suggestions={customSuggestions}
          trim="SE"
          vin="TEST567890ABCDEFG"
          year={2024}
        />
      );

      for (const question of customSuggestions) {
        expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
      }
      expect(screen.getByText("Questions about this Camry?")).toBeInTheDocument();
    });

    it("renders with empty suggestions array (only 'Something else')", () => {
      render(
        <AskQuestionCard
          heading="Questions about this Corolla?"
          model="Corolla"
          suggestions={[]}
          trim="LE"
          vin="EMPT567890ABCDEFG"
          year={2023}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent("Something else");
    });
  });

  describe("Styling", () => {
    it("card has rounded corners", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("rounded-2xl");
    });

    it("card has glass border effect", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-white/20");
    });

    it("card has dark background", () => {
      const { container } = render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const card = container.querySelector("[data-slot='card']");
      expect(card).toHaveClass("bg-opacity-black-26");
    });

    it("heading uses h2 typography utility", () => {
      render(<AskQuestionCard {...DEFAULT_PROPS} />);
      const heading = screen.getByText("Questions about this Highlander Hybrid?");
      expect(heading.tagName).toBe("H2");
      expect(heading).toHaveClass("h2");
    });
  });
});
