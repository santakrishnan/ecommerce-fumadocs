/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  EXTRA_SAVINGS_CONTEXT_FIXTURE,
  type ExtraSavingsOption,
} from "../../../bff/__fixtures__/extra-savings.fixture";
import { ExtraSavingsContent } from "../extra-savings-content";

const EXTRA_SAVINGS_OPTIONS = EXTRA_SAVINGS_CONTEXT_FIXTURE.options;

const CUSTOM_OPTIONS: readonly ExtraSavingsOption[] = [
  { value: "alpha", title: "Alpha option", description: "Alpha description." },
  { value: "beta", title: "Beta option", description: "Beta description." },
];

const ALPHA_LABEL = /alpha option/i;
const BETA_LABEL = /beta option/i;
const MILITARY_LABEL = /active duty military or veteran/i;
const GRADUATE_LABEL = /recent college graduate/i;

describe("ExtraSavingsContent", () => {
  describe("rendering from default options", () => {
    it("renders a checkbox for every default option", () => {
      render(<ExtraSavingsContent />);

      expect(screen.getAllByRole("checkbox")).toHaveLength(EXTRA_SAVINGS_OPTIONS.length);
    });

    it("renders the title and description text for each default option", () => {
      render(<ExtraSavingsContent />);

      for (const option of EXTRA_SAVINGS_OPTIONS) {
        expect(screen.getByText(option.title)).toBeInTheDocument();
        expect(screen.getByText(option.description)).toBeInTheDocument();
      }
    });

    it("associates each checkbox with a stable, prefixed id", () => {
      render(<ExtraSavingsContent />);

      for (const option of EXTRA_SAVINGS_OPTIONS) {
        expect(document.getElementById(`extra-savings-${option.value}`)).toBeInTheDocument();
      }
    });
  });

  describe("data-driven options", () => {
    it("renders the provided options instead of the defaults", () => {
      render(<ExtraSavingsContent options={CUSTOM_OPTIONS} />);

      expect(screen.getAllByRole("checkbox")).toHaveLength(CUSTOM_OPTIONS.length);
      expect(screen.getByText("Alpha option")).toBeInTheDocument();
      expect(screen.getByText("Beta description.")).toBeInTheDocument();
    });
  });

  describe("initial data", () => {
    it("pre-checks options supplied via initialData", () => {
      render(<ExtraSavingsContent initialData={{ military: true }} />);

      expect(screen.getByRole("checkbox", { name: MILITARY_LABEL })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: GRADUATE_LABEL })).not.toBeChecked();
    });
  });

  describe("toggling", () => {
    it("renders every checkbox unchecked by default", () => {
      render(<ExtraSavingsContent options={CUSTOM_OPTIONS} />);

      for (const checkbox of screen.getAllByRole("checkbox")) {
        expect(checkbox).not.toBeChecked();
      }
    });

    it("checks a card on click and unchecks it on a second click", async () => {
      const user = userEvent.setup();
      render(<ExtraSavingsContent options={CUSTOM_OPTIONS} />);

      const alpha = screen.getByRole("checkbox", { name: ALPHA_LABEL });

      await user.click(alpha);
      expect(alpha).toBeChecked();

      await user.click(alpha);
      expect(alpha).not.toBeChecked();
    });

    it("tracks each option independently (multi-select)", async () => {
      const user = userEvent.setup();
      render(<ExtraSavingsContent options={CUSTOM_OPTIONS} />);

      const alpha = screen.getByRole("checkbox", { name: ALPHA_LABEL });
      const beta = screen.getByRole("checkbox", { name: BETA_LABEL });

      await user.click(alpha);
      await user.click(beta);

      expect(alpha).toBeChecked();
      expect(beta).toBeChecked();
    });
  });
});
