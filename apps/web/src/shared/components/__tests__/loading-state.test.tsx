/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import { LoadingState } from "../loading-state";

describe("LoadingState", () => {
  describe("accessibility", () => {
    it("renders a status region with the provided label as the accessible name", () => {
      render(<LoadingState label="Estimating value..." />);

      const region = screen.getByRole("status", { name: "Estimating value..." });
      expect(region).toBeInTheDocument();
    });

    it("has aria-live set to polite", () => {
      render(<LoadingState label="Loading..." />);

      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("brand variant (default)", () => {
    it("renders the label text", () => {
      render(<LoadingState label="Estimating value..." />);

      expect(screen.getByText("Estimating value...")).toBeInTheDocument();
    });

    it("applies the truncate class to the label", () => {
      render(<LoadingState label="Estimating value..." />);

      expect(screen.getByText("Estimating value...")).toHaveClass("truncate");
    });

    it("does not render an SVG image element", () => {
      const { container } = render(<LoadingState label="Estimating value..." />);

      expect(container.querySelector("image")).not.toBeInTheDocument();
    });
  });

  describe("origination variant", () => {
    const LABEL = "No hidden fees. Plus 7-day returns and a 90-day warranty.";
    const IMAGE_SRC = "/images/origination-car.jpg";

    it("renders the label text", () => {
      render(<LoadingState backgroundImage={IMAGE_SRC} label={LABEL} variant="origination" />);

      expect(screen.getByText(LABEL)).toBeInTheDocument();
    });

    it("does not apply truncate to the label", () => {
      render(<LoadingState backgroundImage={IMAGE_SRC} label={LABEL} variant="origination" />);

      expect(screen.getByText(LABEL)).not.toHaveClass("truncate");
    });

    it("renders an SVG image element with the provided backgroundImage src", () => {
      const { container } = render(
        <LoadingState backgroundImage={IMAGE_SRC} label={LABEL} variant="origination" />
      );

      const img = container.querySelector("image");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("href", IMAGE_SRC);
    });

    it("does not render the SVG image when backgroundImage is omitted", () => {
      const { container } = render(<LoadingState label={LABEL} variant="origination" />);

      expect(container.querySelector("image")).not.toBeInTheDocument();
    });

    it("renders a clipPath to clip the image to the icon shape", () => {
      const { container } = render(
        <LoadingState backgroundImage={IMAGE_SRC} label={LABEL} variant="origination" />
      );

      expect(container.querySelector("clipPath")).toBeInTheDocument();
    });

    it("renders the backgroundImageAlt as an SVG title when provided", () => {
      render(
        <LoadingState
          backgroundImage={IMAGE_SRC}
          backgroundImageAlt="A Toyota vehicle"
          label={LABEL}
          variant="origination"
        />
      );

      expect(screen.getByText("A Toyota vehicle")).toBeInTheDocument();
    });

    it("does not render an SVG title when backgroundImageAlt is omitted", () => {
      const { container } = render(
        <LoadingState backgroundImage={IMAGE_SRC} label={LABEL} variant="origination" />
      );

      expect(container.querySelector("title")).not.toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("merges a custom className onto the root wrapper", () => {
      const { container } = render(<LoadingState className="my-custom-class" label="Loading..." />);

      expect(container.firstChild).toHaveClass("my-custom-class");
    });

    it("does not remove the base layout classes when a custom className is provided", () => {
      const { container } = render(<LoadingState className="my-custom-class" label="Loading..." />);

      expect(container.firstChild).toHaveClass("flex", "items-center", "justify-center");
    });
  });
});
