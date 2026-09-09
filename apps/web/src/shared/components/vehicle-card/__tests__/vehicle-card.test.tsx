import { rav4Xse } from "@features/compare/__fixtures__/compare-vehicle";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { formatMileage } from "utils";
import { describe, expect, it, vi } from "vitest";
import { VehicleCard, VehicleCardInteractive } from "../index";
import { toVehicleCardProps } from "../vehicle-card.lib";

// Reuse the canonical RAV4 XSE Vehicle fixture (year 2023, 36,435 mi) mapped to
// VehicleCard props — no vehicle-card-specific demo fixtures required.
const baseProps = toVehicleCardProps(rav4Xse);
const fullProps = { ...baseProps, variant: "full" as const, priority: true };
const longTitleProps = { ...baseProps, title: "TOYOTA HIGHLANDER HYBRID PLATINUM" };

// Local re-mock: shared setup returns next/image's props object, not a renderable element.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    fill,
    priority,
    sizes,
  }: Record<string, unknown>) => (
    // biome-ignore lint/performance/noImgElement: test mock requires a native img
    <img
      alt={alt as string}
      className={className as string}
      data-fill={fill ? "true" : undefined}
      data-priority={priority ? "true" : undefined}
      data-sizes={sizes as string}
      data-testid="vehicle-image"
      height={height as number}
      src={src as string}
      width={width as number}
    />
  ),
}));

const FIXTURE_DETAIL_RE = /2023.*36,435 mi/;
const FIXTURE_MILEAGE_RE = /36,435 mi/;
const CUSTOM_DETAIL_RE = /2019.*12,345 mi/;

describe("VehicleCard", () => {
  describe("Text rendering", () => {
    it("renders the title from props", () => {
      render(<VehicleCard {...baseProps} />);
      expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    });

    it("renders the title in an h3 with the vehicle-title-sm preset + 2-line clamp", () => {
      render(<VehicleCard {...baseProps} />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(baseProps.title);
      expect(heading).toHaveClass("vehicle-title-sm");
      expect(heading).toHaveClass("line-clamp-2");
      expect(heading).toHaveClass("max-h-[2lh]");
    });

    it("renders the detail line as `{year} • {formatMileage(mileage)}` with the body-md preset", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const detail = container.querySelector('[data-slot="vehicle-card-detail"]');
      expect(detail).toHaveClass("body-md");
      expect(detail).toHaveTextContent(`${baseProps.year}`);
      expect(detail).toHaveTextContent(formatMileage(baseProps.mileage));
    });

    it("hides the bullet separator from assistive tech so it isn't announced as 'bullet'", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const detail = container.querySelector('[data-slot="vehicle-card-detail"]');
      const separator = detail?.querySelector("span[aria-hidden='true']");
      expect(separator).toHaveTextContent("•");
    });

    it("reuses formatMileage (36,435 mi) rather than a hardcoded value", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const detail = container.querySelector('[data-slot="vehicle-card-detail"]');
      expect(detail).toHaveTextContent(FIXTURE_MILEAGE_RE);
    });

    it("derives displayed values from props, not constants", () => {
      const { container } = render(
        <VehicleCard
          imageAlt="alt"
          imageSrc="/x.png"
          mileage={12_345}
          title="CUSTOM TITLE"
          year={2019}
        />
      );
      expect(screen.getByText("CUSTOM TITLE")).toBeInTheDocument();
      const detail = container.querySelector('[data-slot="vehicle-card-detail"]');
      expect(detail).toHaveTextContent(CUSTOM_DETAIL_RE);
    });

    it("applies text-text-primary at the card root", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const root = container.querySelector('[data-slot="vehicle-card"]');
      expect(root).toHaveClass("text-text-primary");
    });
  });

  describe("Image", () => {
    it("renders the thumbnail with props src/alt at 75×75", () => {
      render(<VehicleCard {...baseProps} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("src", baseProps.imageSrc);
      expect(image).toHaveAttribute("alt", baseProps.imageAlt);
      expect(image).toHaveAttribute("width", "75");
      expect(image).toHaveAttribute("height", "75");
      expect(image).toHaveClass("object-cover");
    });

    it("wraps the image in a clipped, rounded, white container sized 75px", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const imageBox = container.querySelector('[data-slot="vehicle-card-image"]');
      expect(imageBox).toHaveClass("size-19");
      expect(imageBox).toHaveClass("overflow-hidden");
      expect(imageBox).toHaveClass("rounded-md");
      expect(imageBox).toHaveClass("bg-surface-primary");
    });
  });

  describe("Layout & structure", () => {
    it("uses a semantic <div> root with the flex row classes", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const root = container.querySelector('[data-slot="vehicle-card"]');
      expect(root?.tagName).toBe("DIV");
      expect(root).toHaveClass("flex");
      expect(root).toHaveClass("w-full");
      expect(root).toHaveClass("gap-4");
      expect(root).toHaveClass("rounded-xl");
      expect(root).toHaveClass("p-4");
      expect(root).toHaveClass("pr-5");
    });

    it("gives the text column min-w-0 so the title can clamp instead of overflowing", () => {
      const { container } = render(<VehicleCard {...longTitleProps} />);
      const body = container.querySelector('[data-slot="vehicle-card-body"]');
      expect(body).toHaveClass("min-w-0");
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveClass("line-clamp-2");
      expect(heading).toHaveClass("max-h-[2lh]");
      expect(heading).toHaveTextContent(longTitleProps.title);
    });
  });

  describe("Trailing slot (compact)", () => {
    it("renders trailing content after the text column", () => {
      render(<VehicleCard {...baseProps} trailing={<span data-testid="trailing">→</span>} />);
      expect(screen.getByTestId("trailing")).toBeInTheDocument();
    });

    it("does not render the trailing wrapper when trailing is not provided", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      const root = container.querySelector('[data-slot="vehicle-card"]');
      // Only the image box and text column should exist as direct children
      const trailingWrapper = root?.querySelector(".ml-auto");
      expect(trailingWrapper).toBeNull();
    });
  });

  describe("Full variant", () => {
    it("renders with vertical layout (image on top)", () => {
      const { container } = render(<VehicleCard {...fullProps} />);
      const root = container.querySelector('[data-slot="vehicle-card"]');
      expect(root?.tagName).toBe("ARTICLE");
      expect(root).toHaveClass("flex-col");
      expect(root).toHaveClass("rounded-xl");
      expect(root).toHaveClass("bg-surface-primary");
    });

    it("renders title and metadata below image", () => {
      render(<VehicleCard {...fullProps} />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(fullProps.title);
      expect(heading).toHaveClass("vehicle-title-sm");
      expect(heading).toHaveClass("uppercase");

      const metadata = heading.closest("div")?.querySelector("p");
      expect(metadata).toHaveClass("body-md");
      expect(metadata).toHaveClass("text-text-secondary");
      expect(metadata).toHaveTextContent(`${fullProps.year} • ${formatMileage(fullProps.mileage)}`);
    });

    it("renders trailing slot content when provided", () => {
      render(<VehicleCard {...fullProps} trailing={<span data-testid="full-trailing">▼</span>} />);
      expect(screen.getByTestId("full-trailing")).toBeInTheDocument();
    });

    it("isSelected shows overlay on hero image", () => {
      const { container } = render(<VehicleCard {...fullProps} isSelected />);
      const imageContainer = container.querySelector(".relative.aspect-\\[177\\/140\\]");
      const overlay = imageContainer?.querySelector('[data-slot="vehicle-card-image-overlay"]');
      expect(overlay).toBeInTheDocument();
    });

    it("priority prop passes through to Image", () => {
      render(<VehicleCard {...fullProps} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-priority", "true");
    });

    it("uses fill mode with correct sizes attribute", () => {
      render(<VehicleCard {...fullProps} />);
      const image = screen.getByTestId("vehicle-image");
      expect(image).toHaveAttribute("data-fill", "true");
      expect(image).toHaveAttribute(
        "data-sizes",
        "(min-width: 1024px) 334px, (min-width: 768px) 50vw, 50vw"
      );
    });
  });

  describe("Public surface", () => {
    it("renders end-to-end via the public export using the fixture", () => {
      const { container } = render(<VehicleCard {...baseProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("TOYOTA RAV4 XSE");
      expect(screen.getByTestId("vehicle-image")).toBeInTheDocument();
      const detail = container.querySelector('[data-slot="vehicle-card-detail"]');
      expect(detail).toHaveTextContent(FIXTURE_DETAIL_RE);
    });
  });

  describe("VehicleCardInteractive", () => {
    const interactiveProps = {
      ...baseProps,
      ariaLabel: "Toggle RAV4 XSE",
      onSelectToggle: vi.fn(),
    };

    it("renders as a button with correct aria attributes", () => {
      render(<VehicleCardInteractive {...interactiveProps} isSelected={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Toggle RAV4 XSE");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("calls onSelectToggle when clicked", () => {
      const onSelectToggle = vi.fn();
      render(<VehicleCardInteractive {...interactiveProps} onSelectToggle={onSelectToggle} />);
      const button = screen.getByRole("button");
      button.click();
      expect(onSelectToggle).toHaveBeenCalledOnce();
    });

    it("renders full variant as a button", () => {
      render(<VehicleCardInteractive {...interactiveProps} variant="full" />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("flex-col");
      expect(button).toHaveAttribute("data-slot", "vehicle-card");
    });

    it("renders trailing slot in interactive compact variant", () => {
      render(
        <VehicleCardInteractive
          {...interactiveProps}
          trailing={<span data-testid="interactive-trailing">→</span>}
        />
      );
      expect(screen.getByTestId("interactive-trailing")).toBeInTheDocument();
    });
  });
});
