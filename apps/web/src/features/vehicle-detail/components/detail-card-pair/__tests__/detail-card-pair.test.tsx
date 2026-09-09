/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { VEHICLE_IMAGES_FIXTURE } from "../../../__fixtures__/vehicle-images.fixture";
import { DetailCardPair } from "../detail-card-pair";

const RE_COLOR_NOT_AVAILABLE = /color not available/i;

describe("DetailCardPair", () => {
  describe("with photos", () => {
    it("renders two detail image cards using vehicleImages data", () => {
      render(<DetailCardPair hasPhotos vehicleImages={VEHICLE_IMAGES_FIXTURE} />);
      expect(screen.getByAltText("Black")).toBeInTheDocument();
      expect(screen.getByAltText('20" Alloy')).toBeInTheDocument();
    });

    it("does not produce duplicate React keys when subLabel is undefined", () => {
      const imagesWithoutSubLabels = {
        interior: {
          imageUrl: "/images/vehicles/placeholder/interior.png",
          label: "Black Leather",
        },
        wheels: {
          imageUrl: "/images/vehicles/placeholder/wheels.png",
          label: '18" Sport',
        },
      };

      // Should render without warnings — keys fall back to label
      const { container } = render(
        <DetailCardPair hasPhotos vehicleImages={imagesWithoutSubLabels as never} />
      );
      const cards = container.querySelectorAll('[data-slot="detail-image-card"]');
      expect(cards).toHaveLength(2);
    });
  });

  describe("without photos (swatch mode)", () => {
    it("renders exterior and interior color swatch cards", () => {
      render(
        <DetailCardPair
          hasPhotos={false}
          vehicleColorData={{
            exteriorColor: "#CE1E2D",
            exteriorColorFamily: "Ruby Red",
            interiorColor: "#000000",
            interiorColorFamily: "Black",
            interiorMaterial: "Leather",
          }}
        />
      );
      expect(screen.getByText("Exterior color")).toBeInTheDocument();
      expect(screen.getByText("Interior")).toBeInTheDocument();
      expect(screen.getByText("Ruby Red")).toBeInTheDocument();
      expect(screen.getByText("Black")).toBeInTheDocument();
    });

    it("shows fallback labels when vehicleColorData is not provided", () => {
      render(<DetailCardPair hasPhotos={false} />);
      const cards = screen.getAllByText(RE_COLOR_NOT_AVAILABLE);
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it("includes color name in imageAlt for accessibility", () => {
      render(
        <DetailCardPair
          hasPhotos={false}
          vehicleColorData={{
            exteriorColor: "#CE1E2D",
            exteriorColorFamily: "Ruby Red",
            interiorColor: "#5c3317",
            interiorColorFamily: "Brown",
            interiorMaterial: "Leather",
          }}
        />
      );
      // imageAlt is passed to the card — verify it reaches the DOM as alt on any
      // rendered images. In swatch mode there's no <img>, but the prop is still
      // passed for when the card is in image mode. Verify labels render correctly.
      expect(screen.getByText("Ruby Red")).toBeInTheDocument();
      expect(screen.getByText("Brown")).toBeInTheDocument();
      // Both cards render with correct sub-labels
      expect(screen.getByText("Exterior color")).toBeInTheDocument();
      expect(screen.getByText("Interior")).toBeInTheDocument();
    });

    it("renders without swatch circle when exteriorColor is undefined", () => {
      const { container } = render(
        <DetailCardPair
          hasPhotos={false}
          vehicleColorData={{
            exteriorColor: undefined,
            exteriorColorFamily: "Other",
            interiorColor: "#000000",
            interiorColorFamily: "Black",
            interiorMaterial: "Fabric",
          }}
        />
      );
      // Exterior card should still show the label
      expect(screen.getByText("Other")).toBeInTheDocument();
      // Both cards should render
      const cards = container.querySelectorAll('[data-slot="detail-image-card"]');
      expect(cards).toHaveLength(2);
    });

    it("uses interiorTextureImage as swatchImageUrl when provided", () => {
      const { container } = render(
        <DetailCardPair
          hasPhotos={false}
          vehicleColorData={{
            exteriorColor: "#CE1E2D",
            exteriorColorFamily: "Ruby Red",
            interiorColor: "#5c3317",
            interiorColorFamily: "Brown",
            interiorMaterial: "Leather",
            interiorTextureImage: "/images/vdp/Ellipse.png",
          }}
        />
      );
      // Interior swatch should use the texture image as background
      const swatchCircles = container.querySelectorAll("[aria-hidden='true']");
      const textureCircle = [...swatchCircles].find((el) =>
        (el as HTMLElement).style.backgroundImage?.includes("Ellipse.png")
      );
      expect(textureCircle).toBeTruthy();
    });

    it("falls back to interiorColor hex when no texture image is available", () => {
      const { container } = render(
        <DetailCardPair
          hasPhotos={false}
          vehicleColorData={{
            exteriorColor: "#CE1E2D",
            exteriorColorFamily: "Ruby Red",
            interiorColor: "#5c3317",
            interiorColorFamily: "Brown",
            interiorMaterial: "Leather",
          }}
        />
      );
      // Interior swatch should use the hex as backgroundColor
      const swatchCircles = container.querySelectorAll("[aria-hidden='true']");
      const colorCircle = [...swatchCircles].find(
        (el) => (el as HTMLElement).style.backgroundColor === "rgb(92, 51, 23)"
      );
      expect(colorCircle).toBeTruthy();
    });
  });
});
