/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { FINANCING_COAPPLICANT_ITEMS } from "../../bff/__fixtures__/financing-coapplicant.fixture";
import { FinancingCoApplicantContent } from "../financing-coapplicant-content";

function renderComponent(onSelect?: (choice: "own-financing" | "co-applicant-financing") => void) {
  return render(<FinancingCoApplicantContent onSelect={onSelect} />);
}

describe("FinancingCoApplicantContent", () => {
  describe("rendering", () => {
    it("renders an item for each option", () => {
      renderComponent();
      for (const item of FINANCING_COAPPLICANT_ITEMS) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
        if ("description" in item && item.description) {
          expect(screen.getByText(item.description)).toBeInTheDocument();
        }
      }
    });

    it("does not render a description for the own-financing option", () => {
      renderComponent();
      const ownFinancing = FINANCING_COAPPLICANT_ITEMS.find((i) => i.id === "own-financing");
      expect(ownFinancing && "description" in ownFinancing).toBe(false);
    });

    it("renders each option as a button", () => {
      renderComponent();
      expect(screen.getAllByRole("button")).toHaveLength(FINANCING_COAPPLICANT_ITEMS.length);
    });
  });

  describe("selection", () => {
    it("reports 'own-financing' when the first option is selected", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("I am financing on my own"));

      expect(onSelect).toHaveBeenCalledWith("own-financing");
    });

    it("reports 'co-applicant-financing' when the second option is selected", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("I have a co-applicant"));

      expect(onSelect).toHaveBeenCalledWith("co-applicant-financing");
    });

    it("does not submit anything itself — selection is delegated to the parent", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderComponent(onSelect);

      await user.click(screen.getByText("I am financing on my own"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("does not throw when clicked without an onSelect handler", async () => {
      const user = userEvent.setup();
      renderComponent();

      await expect(user.click(screen.getByText("I have a co-applicant"))).resolves.not.toThrow();
    });
  });
});
