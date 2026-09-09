/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import {
  ORIGINATION_LOADING_LABEL_EARLY,
  ORIGINATION_LOADING_LABEL_LATE,
  OriginationLoadingState,
} from "../origination-loading-state";

describe("OriginationLoadingState", () => {
  describe("default / early step", () => {
    it("renders the early default label when no props are provided", () => {
      render(<OriginationLoadingState />);

      expect(screen.getByText(ORIGINATION_LOADING_LABEL_EARLY)).toBeInTheDocument();
    });

    it("renders the origination variant — SVG image element is present", () => {
      const { container } = render(<OriginationLoadingState />);

      expect(container.querySelector("image")).toBeInTheDocument();
    });

    it("does not apply truncate to the label", () => {
      render(<OriginationLoadingState />);

      expect(screen.getByText(ORIGINATION_LOADING_LABEL_EARLY)).not.toHaveClass("truncate");
    });
  });

  describe("late step", () => {
    it("renders the late default label", () => {
      render(<OriginationLoadingState step="late" />);

      expect(screen.getByText(ORIGINATION_LOADING_LABEL_LATE)).toBeInTheDocument();
    });

    it("renders the brand variant — no SVG image element", () => {
      const { container } = render(<OriginationLoadingState step="late" />);

      expect(container.querySelector("image")).not.toBeInTheDocument();
    });

    it("applies truncate to the label", () => {
      render(<OriginationLoadingState step="late" />);

      expect(screen.getByText(ORIGINATION_LOADING_LABEL_LATE)).toHaveClass("truncate");
    });
  });

  describe("label override", () => {
    it("uses the provided label instead of the early default", () => {
      render(<OriginationLoadingState label="Checking your eligibility..." />);

      expect(screen.getByText("Checking your eligibility...")).toBeInTheDocument();
      expect(screen.queryByText(ORIGINATION_LOADING_LABEL_EARLY)).not.toBeInTheDocument();
    });

    it("uses the provided label instead of the late default", () => {
      render(<OriginationLoadingState label="Reviewing your details..." step="late" />);

      expect(screen.getByText("Reviewing your details...")).toBeInTheDocument();
      expect(screen.queryByText(ORIGINATION_LOADING_LABEL_LATE)).not.toBeInTheDocument();
    });
  });
});
